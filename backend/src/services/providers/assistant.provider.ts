import type {
  AssistantFilters,
  AssistantIntent,
  AssistantRelaxation,
  UnsupportedConstraint,
} from '@makaan/shared/types/assistant';
import type { Locale } from '@makaan/shared/types/marketplace';

/** A governed area the assistant may resolve a question to, with reviewed aliases. */
export interface AssistantAreaOption {
  id: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
}

export interface AssistantInterpretationInput {
  message: string;
  locale: Locale;
  /** Filters carried over from the previous turn so follow-up questions work. */
  context?: AssistantFilters;
  areas: ReadonlyArray<AssistantAreaOption>;
}

export interface AssistantInterpretation {
  intent: AssistantIntent;
  filters: AssistantFilters;
  /** Knowledge-base topic identifiers behind an FAQ answer. */
  topics: string[];
  /** True when the visitor asked to start a new search rather than refine one. */
  resetContext: boolean;
  /**
   * True when the message states a complete request. Context is carried forward
   * only into refinements, so naming what you want never inherits an area or a
   * budget from an earlier turn.
   */
  standaloneRequest: boolean;
  /** True when the visitor asked for the next page of the same search. */
  wantsMore: boolean;
  /** Constraints the question stated that public search cannot express. */
  unsupported: UnsupportedConstraint[];
}

export interface AssistantCompositionInput {
  locale: Locale;
  intent: AssistantIntent;
  filters: AssistantFilters;
  topics: string[];
  totalMatches: number;
  shownCount: number;
  relaxations: AssistantRelaxation[];
  /** True when filters carried over from an earlier turn shaped this answer. */
  continuedFromContext: boolean;
  /** Constraints that must be disclosed as not applied. */
  unsupported: UnsupportedConstraint[];
  priceRange?: { min: number; max: number };
  /**
   * The first card of the answer, present when the question asked for an extreme.
   * A superlative wants one home named, not a count of everything that matched —
   * and the count only grows less useful as the catalogue does.
   */
  highlight?: {
    priceEgp: number;
    propertyType: string;
    bedrooms: number;
    areaAr: string;
    areaEn: string;
  };
  /** Which page of the same search this answer covers. */
  page: number;
  areaNames: ReadonlyArray<{ nameAr: string; nameEn: string }>;
}

export interface AssistantComposition {
  reply: string;
  suggestions: string[];
}

/**
 * Splits assistant behaviour into understanding and wording so retrieval always
 * stays in `AssistantService`. An adapter never reads listings itself, which keeps
 * exact locations, seller contacts, and moderation data outside its reach whatever
 * implementation is registered for the validated application mode.
 */
export interface AssistantProvider {
  readonly name: string;
  interpret(
    input: AssistantInterpretationInput,
  ): Promise<AssistantInterpretation>;
  compose(input: AssistantCompositionInput): Promise<AssistantComposition>;
}
