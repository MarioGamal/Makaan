import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';

import type { PublicListingSearchResponse } from '@makaan/shared/types/marketplace';

import { FilterPanel } from '../components/filters/FilterPanel';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { SchematicMap } from '../components/map/SchematicMap';
import { AsyncState, Button, SegmentedControl } from '../components/ui';
import { ListIcon, MapIcon } from '../components/ui/icons';
import {
  buildSearchParams,
  pruneFilters,
  toBrowseQuery,
  usePropertiesSearch,
  type PropertyFilters,
  type SearchState,
} from '../hooks/usePropertiesSearch';
import { catalogues, formatNumber, translate } from '../i18n';
import { parseBoundingBox } from '../lib/geo';
import { searchListings } from '../services/listings.service';
import { localeFromCookie } from '../utils/locale';

/**
 * Divisible by every column count the grid uses — one, two and three — so a
 * page never ends in a half-empty row. Twenty left a gap on the last row at
 * three columns. The API caps a page at 40.
 */
const PAGE_SIZE = 24;
const FIRST_ROW = 3;

type BrowsePageProps = {
  initialFilters: PropertyFilters;
  initialPage: number;
  initialBbox: string | null;
  initialView: 'list' | 'map';
  /** The first page, rendered on the server so results are in the HTML. */
  initialResults: PublicListingSearchResponse | null;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const many = (value: string | string[] | undefined) => {
  if (value === undefined) return undefined;
  const items = (Array.isArray(value) ? value : [value]).filter(Boolean);
  return items.length ? items : undefined;
};

const positive = (value: string | string[] | undefined) => {
  const parsed = Number(first(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

/** Only values the public contract accepts survive this. */
function filtersFromQuery(
  query: Record<string, string | string[] | undefined>,
): PropertyFilters {
  const purpose = first(query.purpose);
  const participation = first(query.participation);
  const sort = first(query.sort);
  return {
    purpose:
      purpose === 'sale' || purpose === 'long_term_rent' ? purpose : undefined,
    areaId: many(query.areaId),
    propertyType: many(query.propertyType),
    priceMin: positive(query.priceMin),
    priceMax: positive(query.priceMax),
    sizeMin: positive(query.sizeMin),
    sizeMax: positive(query.sizeMax),
    bedroomsMin: positive(query.bedroomsMin),
    bedroomsMax: positive(query.bedroomsMax),
    participation:
      participation === 'verified_owner' ||
      participation === 'owner_not_verified' ||
      participation === 'declared_agent'
        ? participation
        : undefined,
    sort:
      sort === 'price_asc' || sort === 'price_desc' || sort === 'newest'
        ? sort
        : 'newest',
  };
}

export default function BrowsePage({
  initialFilters,
  initialPage,
  initialBbox,
  initialView,
  initialResults,
}: BrowsePageProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [view, setView] = useState<'list' | 'map'>(initialView);
  const [selectedId, setSelectedId] = useState<string>();

  /*
   * The URL mirrors the search so it stays shareable and reloadable, but it is
   * not the source of truth: a replace per keystroke would re-run the server
   * render on every character.
   */
  const syncUrl = useCallback(
    (state: SearchState) => {
      const query = toBrowseQuery(
        buildSearchParams(state.filters, {
          locale,
          page: state.page,
          pageSize: PAGE_SIZE,
          mapArea: state.mapArea,
        }),
      );
      const search = [query, view === 'map' ? 'view=map' : '']
        .filter(Boolean)
        .join('&');
      void router.replace(search ? `/browse?${search}` : '/browse', undefined, {
        shallow: true,
        scroll: false,
      });
    },
    [locale, router, view],
  );

  const search = usePropertiesSearch({
    locale,
    initialFilters,
    initialPage,
    initialMapArea: { bbox: parseBoundingBox(initialBbox) },
    pageSize: PAGE_SIZE,
    fallbackData: initialResults ?? undefined,
    onStateChange: syncUrl,
  });

  const labels = useMemo(
    () => ({
      ...copy,
      verified_owner: copy.verifiedOwner,
      owner_not_verified: copy.owner,
      declared_agent: copy.agent,
    }),
    [copy],
  );

  const selected = search.listings.find((listing) => listing.id === selectedId);
  const shown = search.listings.length;
  const title = `${translate(locale, 'navigation.browse')} · ${translate(locale, 'brand')}`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta content={copy.intro} name="description" />
      </Head>

      <main className="bg-canvas pb-16" id="main-content">
        <div className="mx-auto max-w-content space-y-6 px-4 py-8 sm:px-6 md:py-12">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                {copy.eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
                {copy.resultsHeading}
              </h1>
              <p
                aria-live="polite"
                className="mt-2 text-sm text-ink-muted"
                data-testid="results-summary"
              >
                {search.isLoading
                  ? copy.search
                  : `${formatNumber(search.total, locale)} ${copy.results}`}
                {shown > 0 && search.total > shown
                  ? ` · ${translate(locale, 'marketplace.showingResults', {
                      count: formatNumber(shown, locale),
                      total: formatNumber(search.total, locale),
                    })}`
                  : ''}
              </p>
            </div>

            <SegmentedControl
              label={copy.map}
              onChange={(next) => setView(next)}
              options={[
                {
                  value: 'list' as const,
                  label: copy.list,
                  icon: <ListIcon className="size-4" />,
                  testId: 'view-list',
                },
                {
                  value: 'map' as const,
                  label: copy.map,
                  icon: <MapIcon className="size-4" />,
                  testId: 'view-map',
                },
              ]}
              value={view}
            />
          </header>

          <FilterPanel
            activeCount={search.activeFilterCount}
            copy={labels}
            filters={search.filters}
            locale={locale}
            onChange={search.patchFilters}
            onClear={search.resetFilters}
          />

          {view === 'map' ? (
            <div className="space-y-4">
              <SchematicMap
                labels={labels}
                listings={search.listings}
                locale={locale}
                mapMoved={search.mapDirty}
                onSearchArea={search.commitMapArea}
                onSelect={setSelectedId}
                onViewportChange={search.handleMapMove}
                selectedId={selectedId}
              />
              {search.mapArea.bbox ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-ink-muted">{copy.mapMoved}</p>
                  <Button
                    onClick={search.clearMapArea}
                    size="sm"
                    variant="ghost"
                  >
                    {copy.reset}
                  </Button>
                </div>
              ) : null}
              {selected ? (
                <div className="max-w-md">
                  <PublicListingCard
                    labels={labels}
                    listing={selected}
                    locale={locale}
                    priority
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <section
            aria-busy={search.isRefreshing}
            data-testid="listing-results"
            id="listings"
          >
            {search.isLoading ? (
              <AsyncState state="loading" title={copy.search} />
            ) : search.error ? (
              <AsyncState
                description={copy.error}
                onRetry={search.retry}
                retryLabel={copy.retry}
                state="error"
              />
            ) : search.listings.length === 0 ? (
              <AsyncState
                description={copy.noResults}
                onRetry={search.resetFilters}
                retryLabel={copy.reset}
                state="empty"
              />
            ) : (
              <div
                className={`grid gap-x-6 gap-y-9 transition-opacity duration-200 sm:grid-cols-2 ${
                  view === 'map' ? 'xl:grid-cols-2' : 'lg:grid-cols-3'
                } ${search.isRefreshing ? 'opacity-60' : 'opacity-100'}`}
              >
                {search.listings.map((listing, index) => (
                  <PublicListingCard
                    key={listing.id}
                    labels={labels}
                    listing={listing}
                    locale={locale}
                    priority={index < FIRST_ROW}
                  />
                ))}
              </div>
            )}
          </section>

          {search.page > 1 || search.hasMore ? (
            <nav
              aria-label={copy.results}
              className="flex items-center justify-center gap-3 pt-2"
            >
              <Button
                disabled={search.page <= 1}
                onClick={search.previousPage}
                variant="secondary"
              >
                {copy.previous}
              </Button>
              <span className="text-sm text-ink-muted" data-numeric>
                {formatNumber(search.page, locale)}
              </span>
              <Button
                disabled={!search.hasMore}
                onClick={search.nextPage}
                variant="secondary"
              >
                {copy.loadMore}
              </Button>
            </nav>
          ) : null}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<BrowsePageProps> = async (
  context,
) => {
  const locale = localeFromCookie(context.req.headers.cookie);
  const filters = filtersFromQuery(context.query);
  const page = Math.max(1, Number(first(context.query.page)) || 1);
  const bbox = first(context.query.bbox) ?? null;
  const params = buildSearchParams(filters, {
    locale,
    page,
    pageSize: PAGE_SIZE,
    mapArea: { bbox: parseBoundingBox(bbox) },
  });

  let initialResults: PublicListingSearchResponse | null = null;
  try {
    initialResults = await searchListings(params);
  } catch {
    // A failed pre-render must not take the page down: the browser retries
    // the same query and the error state is rendered there.
    initialResults = null;
  }

  return {
    props: {
      initialFilters: pruneFilters(filters),
      initialPage: page,
      initialBbox: bbox,
      initialView: first(context.query.view) === 'map' ? 'map' : 'list',
      initialResults,
    },
  };
};
