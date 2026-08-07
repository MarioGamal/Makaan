import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import {
  FilterPanel,
  type ListingFilters,
} from '../components/filters/FilterPanel';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { SchematicMap } from '../components/map/SchematicMap';
import { AreaSearchBar } from '../components/search/AreaSearchBar';
import { AsyncState, Button } from '../components/ui';
import { catalogues } from '../i18n';
import { useListings } from '../hooks/useListings';
import type { ListingSearchParams } from '../services/listings.service';

const text = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;
const number = (value: string | string[] | undefined) => {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

function queryToParams(
  query: Record<string, string | string[] | undefined>,
  locale: 'ar' | 'en',
): ListingSearchParams {
  const purpose = text(query.purpose);
  const sort = text(query.sort);
  return {
    locale,
    purpose:
      purpose === 'sale' || purpose === 'long_term_rent' ? purpose : undefined,
    areaId: typeof query.areaId === 'string' ? [query.areaId] : query.areaId,
    propertyType:
      typeof query.propertyType === 'string'
        ? [query.propertyType]
        : query.propertyType,
    priceMin: number(query.priceMin),
    priceMax: number(query.priceMax),
    sizeMin: number(query.sizeMin),
    sizeMax: number(query.sizeMax),
    bedroomsMin: number(query.bedroomsMin),
    participation: [
      'verified_owner',
      'owner_not_verified',
      'declared_agent',
    ].includes(text(query.participation) ?? '')
      ? (text(query.participation) as ListingSearchParams['participation'])
      : undefined,
    sort:
      sort === 'price_asc' || sort === 'price_desc' || sort === 'newest'
        ? sort
        : 'newest',
    page: Math.max(1, number(query.page) ?? 1),
    pageSize: 20,
  };
}

export default function HomePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const view = text(router.query.view) === 'map' ? 'map' : 'list';
  const [selectedId, setSelectedId] = useState<string>();
  const params = useMemo(
    () => queryToParams(router.query, locale),
    [locale, router.query],
  );
  const { listings, response, error, isLoading, retry } = useListings(params);
  const update = (
    next: Partial<ListingSearchParams> & { view?: 'list' | 'map' },
  ) => {
    const query: Record<string, string | string[]> = {};
    const merged = { ...params, ...next };
    Object.entries(merged).forEach(([key, value]) => {
      if (key === 'locale' || value === undefined || value === '') return;
      query[key] = Array.isArray(value) ? value : String(value);
    });
    if (next.view) query.view = next.view;
    void router.push({ pathname: '/', query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };
  const filters: ListingFilters = {
    purpose: params.purpose,
    propertyType: params.propertyType,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    sizeMin: params.sizeMin,
    sizeMax: params.sizeMax,
    bedroomsMin: params.bedroomsMin,
    participation: params.participation,
    sort: params.sort,
  };
  const labelMap = {
    ...copy,
    verified_owner: copy.verifiedOwner,
    owner_not_verified: copy.owner,
    declared_agent: copy.agent,
  };
  return (
    <main className="bg-canvas py-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-7 px-4 md:px-8">
        <section className="grid gap-6 rounded-panel bg-primary p-6 text-white shadow-ui md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <p className="text-sm font-bold text-primary-soft">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
              {copy.headline}
            </h1>
            <p className="mt-4 max-w-xl text-primary-soft">{copy.intro}</p>
          </div>
          <div className="rounded-panel bg-surface p-4 text-ink">
            <AreaSearchBar
              label={copy.area}
              onSelect={(area) => update({ areaId: [area.id], page: 1 })}
            />
            <Button
              className="mt-3"
              fullWidth
              onClick={() => update({ page: 1 })}
            >
              {copy.search}
            </Button>
          </div>
        </section>
        <FilterPanel
          copy={copy}
          filters={filters}
          locale={locale}
          onChange={(next) => update({ ...next, page: 1 })}
          onClear={() => {
            setSelectedId(undefined);
            void router.push('/', undefined, { shallow: true });
          }}
        />
        <section className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="font-semibold">
            {response?.total ?? 0} {copy.results}
          </p>
          <div className="flex gap-2">
            <Button
              aria-pressed={view === 'list'}
              onClick={() => update({ view: 'list' })}
              variant={view === 'list' ? 'primary' : 'secondary'}
            >
              {copy.list}
            </Button>
            <Button
              aria-pressed={view === 'map'}
              onClick={() => update({ view: 'map' })}
              variant={view === 'map' ? 'primary' : 'secondary'}
            >
              {copy.map}
            </Button>
          </div>
        </section>
        {isLoading ? (
          <AsyncState state="loading" title={copy.search} />
        ) : error ? (
          <AsyncState
            description={copy.error}
            onRetry={retry}
            retryLabel={copy.retry}
            state="error"
          />
        ) : listings.length === 0 ? (
          <AsyncState
            description={copy.noResults}
            onRetry={() => void router.push('/')}
            retryLabel={copy.reset}
            state="empty"
          />
        ) : view === 'map' ? (
          <div className="space-y-4">
            <SchematicMap
              labels={copy}
              listings={listings}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
            {selectedId
              ? listings
                  .filter((listing) => listing.id === selectedId)
                  .map((listing) => (
                    <div className="max-w-md" key={listing.id}>
                      <PublicListingCard
                        labels={labelMap}
                        listing={listing}
                        locale={locale}
                      />
                    </div>
                  ))
              : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <PublicListingCard
                key={listing.id}
                labels={labelMap}
                listing={listing}
                locale={locale}
              />
            ))}
          </div>
        )}
        {response && (params.page! > 1 || response.hasMore) ? (
        <nav aria-label={copy.results} className="flex justify-center gap-2">
            {params.page! > 1 ? (
              <Button
                onClick={() => update({ page: params.page! - 1 })}
                variant="secondary"
              >
                {copy.previous}
              </Button>
            ) : null}
            {response.hasMore ? (
              <Button
                onClick={() => update({ page: params.page! + 1 })}
                variant="secondary"
              >
                {copy.loadMore}
              </Button>
            ) : null}
          </nav>
        ) : null}
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-panel bg-surface p-4 font-semibold">
            {copy.trustOwner}
          </div>
          <div className="rounded-panel bg-surface p-4 font-semibold">
            {copy.trustPrivacy}
          </div>
          <div className="rounded-panel bg-surface p-4 font-semibold">
            {copy.trustReview}
          </div>
        </section>
      </div>
    </main>
  );
}
