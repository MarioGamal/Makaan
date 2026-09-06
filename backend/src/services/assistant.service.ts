import { randomUUID } from 'node:crypto';

import type {
  AssistantFilters,
  AssistantMessageResponse,
  AssistantRelaxation,
} from '@makaan/shared/types/assistant';
import type {
  Locale,
  PublicListingCard,
} from '@makaan/shared/types/marketplace';
import { Inject, Injectable } from '@nestjs/common';

import { PublicListingQueryDto } from '../api/listings/dto/public-listing-query.dto';

import { AreaSearchService, type SearchableArea } from './area-search.service';
import type { AssistantProvider } from './providers/assistant.provider';
import { ASSISTANT_PROVIDER } from './providers/providers.module';
import { PublicListingService } from './public-listing.service';

/** Listings returned alongside an answer. Kept small: this is a chat reply, not a results page. */
const ASSISTANT_RESULT_SIZE = 6;
/**
 * Bounds the widening ladder so one question can never fan out into many queries.
 * A fully specified question builds ten rungs — the exact search, two raised price
 * ceilings, then one rung each for dropping price, size, stepping bedrooms down,
 * dropping property type, participation, area, and finally bedrooms entirely — so
 * the cap has to admit all of them or the widest fallback would be unreachable
 * exactly when it is needed. Each rung stops as soon as something matches.
 */
const MAX_SEARCH_ATTEMPTS = 10;

type Candidate = {
  filters: AssistantFilters;
  relaxations: AssistantRelaxation[];
};

@Injectable()
export class AssistantService {
  constructor(
    @Inject(ASSISTANT_PROVIDER) private readonly provider: AssistantProvider,
    private readonly areaSearch: AreaSearchService,
    private readonly publicListings: PublicListingService,
  ) {}

  async answer(
    message: string,
    locale: Locale,
    context?: AssistantFilters,
  ): Promise<AssistantMessageResponse> {
    const areas = await this.areaSearch.listSearchable();
    const interpretation = await this.provider.interpret({
      message,
      locale,
      context,
      areas,
    });

    const filters =
      interpretation.intent === 'search'
        ? this.mergeContext(interpretation.filters, context, {
            reset:
              interpretation.resetContext || interpretation.standaloneRequest,
          })
        : interpretation.filters;

    let listings: PublicListingCard[] = [];
    let totalMatches = 0;
    let relaxations: AssistantRelaxation[] = [];
    let appliedFilters = filters;

    if (interpretation.intent === 'search') {
      const outcome = await this.searchWithWidening(filters, locale);
      listings = outcome.listings;
      totalMatches = outcome.total;
      relaxations = outcome.relaxations;
      appliedFilters = outcome.filters;
    }

    const prices = listings.map((listing) => listing.priceEgp);
    const continuedFromContext =
      interpretation.intent === 'search' &&
      this.inheritedFrom(interpretation.filters, appliedFilters);
    const composition = await this.provider.compose({
      locale,
      intent: interpretation.intent,
      filters: appliedFilters,
      topics: interpretation.topics,
      totalMatches,
      shownCount: listings.length,
      relaxations,
      continuedFromContext,
      unsupported: interpretation.unsupported,
      priceRange:
        prices.length > 0
          ? { min: Math.min(...prices), max: Math.max(...prices) }
          : undefined,
      areaNames: areas.map((area) => ({
        nameAr: area.nameAr,
        nameEn: area.nameEn,
      })),
    });

    return {
      messageId: randomUUID(),
      locale,
      intent: interpretation.intent,
      reply: composition.reply,
      generated: true,
      provider: this.provider.name,
      listings,
      totalMatches,
      filters: appliedFilters,
      relaxations,
      unsupported: interpretation.unsupported,
      browseQuery: this.browseQuery(appliedFilters),
      suggestions: composition.suggestions,
      topics: interpretation.topics,
    };
  }

  /**
   * Carries the previous turn's filters into a follow-up so "وفي القاهرة الجديدة؟"
   * keeps the purpose, budget, and bedroom count already established.
   *
   * Only refinements inherit. A message that states what the visitor wants —
   * "عاوز شقة غرفتين بس" — is a complete request, and quietly adding the area from
   * an earlier turn answers a narrower question than the one that was asked.
   */
  private mergeContext(
    filters: AssistantFilters,
    context: AssistantFilters | undefined,
    options: { reset: boolean },
  ): AssistantFilters {
    if (options.reset || !context) return filters;
    const merged: AssistantFilters = { ...context, ...filters };
    // An area named this turn replaces the previous one outright rather than
    // leaving a stale display name attached to a new identifier.
    if (filters.areaId) {
      merged.areaId = filters.areaId;
      merged.areaNameAr = filters.areaNameAr;
      merged.areaNameEn = filters.areaNameEn;
    }
    if (filters.priceMin === undefined && filters.priceMax !== undefined) {
      delete merged.priceMin;
    }
    if (filters.priceMax === undefined && filters.priceMin !== undefined) {
      delete merged.priceMax;
    }
    return merged;
  }

  /**
   * Whether the answer used a filter the latest message did not state. A visitor
   * who asks about "the most expensive apartment listed" should never be shown an
   * area and a budget from an earlier turn without being told where they came from.
   */
  private inheritedFrom(
    stated: AssistantFilters,
    applied: AssistantFilters,
  ): boolean {
    const facets = [
      'purpose',
      'areaId',
      'propertyType',
      'priceMin',
      'priceMax',
      'sizeMin',
      'bedroomsMin',
      'bedroomsMax',
      'participation',
    ] as const;
    return facets.some(
      (facet) => applied[facet] !== undefined && stated[facet] === undefined,
    );
  }

  /**
   * Runs the requested search, then progressively loosens one constraint at a time
   * until something matches. Price is relaxed first because a budget is the most
   * common reason a Cairo search comes back empty, and purpose is never relaxed:
   * showing rentals to someone who wants to buy would not be a useful answer.
   */
  private async searchWithWidening(
    filters: AssistantFilters,
    locale: Locale,
  ): Promise<{
    listings: PublicListingCard[];
    total: number;
    relaxations: AssistantRelaxation[];
    filters: AssistantFilters;
  }> {
    const candidates = this.buildCandidates(filters).slice(
      0,
      MAX_SEARCH_ATTEMPTS,
    );

    for (const candidate of candidates) {
      const response = await this.publicListings.search(
        this.toQuery(candidate.filters, locale),
      );
      if (response.total > 0) {
        return {
          listings: response.items,
          total: response.total,
          relaxations: candidate.relaxations,
          filters: candidate.filters,
        };
      }
    }

    const last = candidates[candidates.length - 1] ?? {
      filters,
      relaxations: [],
    };
    return {
      listings: [],
      total: 0,
      relaxations: last.relaxations,
      filters: last.filters,
    };
  }

  private buildCandidates(filters: AssistantFilters): Candidate[] {
    const candidates: Candidate[] = [{ filters, relaxations: [] }];
    let base: AssistantFilters = { ...filters };
    let notes: AssistantRelaxation[] = [];

    if (filters.priceMax !== undefined) {
      const ceiling = filters.priceMax;
      // Alternatives, not accumulations: only the ceiling that worked is reported.
      for (const factor of [1.25, 1.5]) {
        const raised = Math.round((ceiling * factor) / 1_000) * 1_000;
        candidates.push({
          filters: { ...base, priceMax: raised },
          relaxations: [
            ...notes,
            { kind: 'price_ceiling_raised', from: ceiling, to: raised },
          ],
        });
      }
      notes = [...notes, { kind: 'price_ceiling_dropped', from: ceiling }];
      base = { ...base, priceMax: undefined };
      delete base.priceMax;
      candidates.push({ filters: base, relaxations: notes });
    }

    if (base.sizeMin !== undefined) {
      notes = [...notes, { kind: 'size_dropped' }];
      base = { ...base };
      delete base.sizeMin;
      candidates.push({ filters: base, relaxations: notes });
    }

    // An exact count is loosened before the floor is: someone who asked for two
    // bedrooms is better served by a three bedroom home than by nothing at all.
    if (base.bedroomsMax !== undefined) {
      notes = [
        ...notes,
        { kind: 'bedrooms_ceiling_dropped', from: base.bedroomsMax },
      ];
      base = { ...base };
      delete base.bedroomsMax;
      candidates.push({ filters: base, relaxations: notes });
    }

    if (base.bedroomsMin !== undefined && base.bedroomsMin > 1) {
      const from = base.bedroomsMin;
      const to = from - 1;
      notes = [...notes, { kind: 'bedrooms_lowered', from, to }];
      base = { ...base, bedroomsMin: to };
      candidates.push({ filters: base, relaxations: notes });
    }

    if (base.propertyType !== undefined) {
      notes = [
        ...notes,
        { kind: 'property_type_dropped', from: base.propertyType },
      ];
      base = { ...base };
      delete base.propertyType;
      candidates.push({ filters: base, relaxations: notes });
    }

    if (base.participation?.length) {
      notes = [...notes, { kind: 'participation_dropped' }];
      base = { ...base };
      delete base.participation;
      candidates.push({ filters: base, relaxations: notes });
    }

    if (base.areaId !== undefined) {
      notes = [
        ...notes,
        { kind: 'area_dropped', from: base.areaNameAr ?? base.areaId },
      ];
      base = { ...base };
      delete base.areaId;
      delete base.areaNameAr;
      delete base.areaNameEn;
      candidates.push({ filters: base, relaxations: notes });
    }

    // Bedrooms step down once above, which can still exclude everything listed.
    // The last rung keeps only the purpose, so "nothing is available" is said
    // only when it is actually true for buying or for renting.
    if (base.bedroomsMin !== undefined) {
      // Replaces the earlier single step down rather than reporting both.
      notes = [
        ...notes.filter((note) => note.kind !== 'bedrooms_lowered'),
        { kind: 'bedrooms_dropped', from: filters.bedroomsMin ?? 0 },
      ];
      base = { ...base };
      delete base.bedroomsMin;
      candidates.push({ filters: base, relaxations: notes });
    }

    return candidates;
  }

  /**
   * Builds the same validated query object the public search endpoint receives, so
   * the assistant can only ever read the public listing projection.
   */
  private toQuery(
    filters: AssistantFilters,
    locale: Locale,
  ): PublicListingQueryDto {
    const query = new PublicListingQueryDto();
    query.locale = locale;
    query.page = 1;
    query.pageSize = ASSISTANT_RESULT_SIZE;
    query.sort = filters.sort ?? 'newest';
    if (filters.purpose) query.purpose = filters.purpose;
    if (filters.areaId) query.areaId = [filters.areaId];
    if (filters.propertyType) query.propertyType = [filters.propertyType];
    if (filters.priceMin !== undefined) query.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) query.priceMax = filters.priceMax;
    if (filters.sizeMin !== undefined) query.sizeMin = filters.sizeMin;
    if (filters.sizeMax !== undefined) query.sizeMax = filters.sizeMax;
    if (filters.bedroomsMin !== undefined) {
      query.bedroomsMin = filters.bedroomsMin;
    }
    if (filters.bedroomsMax !== undefined) {
      query.bedroomsMax = filters.bedroomsMax;
    }
    if (filters.participation?.length) {
      query.participation = [...filters.participation];
    }
    return query;
  }

  /** Query string that reproduces the answer on the real marketplace search page. */
  private browseQuery(filters: AssistantFilters): string {
    const params = new URLSearchParams();
    if (filters.purpose) params.set('purpose', filters.purpose);
    if (filters.areaId) params.set('areaId', filters.areaId);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.priceMin !== undefined) {
      params.set('priceMin', String(filters.priceMin));
    }
    if (filters.priceMax !== undefined) {
      params.set('priceMax', String(filters.priceMax));
    }
    if (filters.sizeMin !== undefined) {
      params.set('sizeMin', String(filters.sizeMin));
    }
    if (filters.bedroomsMin !== undefined) {
      params.set('bedroomsMin', String(filters.bedroomsMin));
    }
    if (filters.bedroomsMax !== undefined) {
      params.set('bedroomsMax', String(filters.bedroomsMax));
    }
    // The browse page carries a single participation value in its query contract.
    if (filters.participation?.length === 1) {
      params.set('participation', filters.participation[0] as string);
    }
    if (filters.sort) params.set('sort', filters.sort);
    return params.toString();
  }
}

export type { SearchableArea };
