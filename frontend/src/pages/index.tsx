import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  FilterPanel,
  type ListingFilters,
} from '../components/filters/FilterPanel';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { SchematicMap } from '../components/map/SchematicMap';
import { AreaSearchBar } from '../components/search/AreaSearchBar';
import { AsyncState, Button, ScrollReveal } from '../components/ui';
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
    bedroomsMax: number(query.bedroomsMax),
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

export function MarketplaceBrowser() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const brand = catalogues[locale].brand;
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
    void router.push({ pathname: '/browse', query }, undefined, {
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
    bedroomsMax: params.bedroomsMax,
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
    <main className="bg-canvas pb-12 pt-3 md:pb-16 md:pt-5">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 md:px-6 md:py-14">
        <section className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-primary">{copy.eyebrow}</p>
            <h1 className="mt-2 font-display text-3xl font-normal md:text-5xl">
              {copy.browseListings}
            </h1>
            <p className="mt-3 max-w-2xl text-ink-muted">{copy.intro}</p>
          </div>
        </section>
        <ScrollReveal>
          <FilterPanel
            copy={copy}
            filters={filters}
            locale={locale}
            onChange={(next) => update({ ...next, page: 1 })}
            onClear={() => {
              setSelectedId(undefined);
              void router.push('/browse', undefined, { shallow: true });
            }}
          />
        </ScrollReveal>
        <section
          className="relative flex min-h-48 flex-wrap items-end justify-between gap-4 overflow-hidden pt-16"
          id="listings"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 truncate text-[clamp(5rem,14vw,12rem)] font-semibold leading-none tracking-[-0.08em] text-primary opacity-[0.055]"
          >
            {brand}
          </span>
          <ScrollReveal className="relative" from="start">
            <p className="text-sm font-semibold text-primary">{copy.eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-normal md:text-4xl">
              {response?.total ?? 0} {copy.results}
            </h2>
          </ScrollReveal>
          <ScrollReveal className="relative flex gap-2" delay={100}>
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
          </ScrollReveal>
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
            onRetry={() => void router.push('/browse')}
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <ScrollReveal
                delay={(index % 3) * 90}
                from="scale"
                key={listing.id}
              >
                <PublicListingCard
                  labels={labelMap}
                  listing={listing}
                  locale={locale}
                />
              </ScrollReveal>
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
        <section className="grid gap-6 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <div className="h-fit lg:sticky lg:top-8">
            <ScrollReveal from="start">
              <p className="text-sm font-semibold text-primary">
                {copy.trustTitle}
              </p>
              <h2 className="mt-3 max-w-md font-display text-3xl font-normal leading-[1.12] md:text-5xl">
                {copy.headline}
              </h2>
              <p className="mt-5 max-w-md text-ink-muted">{copy.intro}</p>
            </ScrollReveal>
          </div>
          <div className="space-y-4">
            {[
              {
                number: '01',
                label: copy.trustOwner,
                className: 'bg-primary text-white',
              },
              {
                number: '02',
                label: copy.trustPrivacy,
                className: 'bg-surface text-ink',
              },
              {
                number: '03',
                label: copy.trustReview,
                className: 'bg-accent text-white',
              },
            ].map((item, index) => (
              <ScrollReveal delay={index * 80} key={item.number}>
                <article
                  className={`flex min-h-56 flex-col justify-between rounded-[1.75rem] p-6 md:min-h-64 md:p-8 ${item.className}`}
                >
                  <p className="text-sm opacity-70">{item.number}</p>
                  <h3 className="max-w-md font-display text-2xl font-medium leading-tight md:text-3xl">
                    {item.label}
                  </h3>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [purpose, setPurpose] = useState<
    'sale' | 'long_term_rent' | undefined
  >();
  const [areaId, setAreaId] = useState<string>();
  const featured = useListings({
    locale,
    page: 1,
    pageSize: 3,
    sort: 'newest',
  });
  const labels = {
    ...copy,
    verified_owner: copy.verifiedOwner,
    owner_not_verified: copy.owner,
    declared_agent: copy.agent,
  };
  const browse = () => {
    const query: Record<string, string> = {};
    if (purpose) query.purpose = purpose;
    if (areaId) query.areaId = areaId;
    void router.push({ pathname: '/browse', query });
  };

  return (
    <main className="bg-canvas pb-12 pt-3 md:pb-16 md:pt-5">
      <div className="mx-auto max-w-[1580px] space-y-14 px-3 md:px-4 md:space-y-20">
        <section className="editorial-hero relative isolate min-h-[660px] bg-primary shadow-panel md:min-h-[760px]">
          <Image
            alt=""
            className="editorial-hero__media object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1440px"
            src="/images/makaan-green-homes-hero.png"
          />
          <div
            aria-hidden="true"
            className="editorial-hero__veil absolute inset-0"
          />
          <div
            aria-hidden="true"
            className="editorial-hero__light absolute inset-0"
          />
          <div className="relative flex min-h-[660px] flex-col justify-between p-5 text-white sm:p-8 md:min-h-[760px] md:p-10 lg:p-12">
            <div className="hero-nav-in flex items-start justify-between gap-4 border-b border-white/35 pb-5 text-xs font-semibold sm:text-sm">
              <p className="max-w-48 leading-relaxed text-white/90">
                {copy.eyebrow}
              </p>
              <p className="text-end text-white/75">{copy.trustReview}</p>
            </div>
            <div className="space-y-7">
              <div className="hero-copy-in max-w-6xl">
                <h1 className="editorial-display max-w-5xl text-[clamp(2.75rem,6.5vw,6rem)] text-balance">
                  {copy.headline}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                  {copy.intro}
                </p>
              </div>
              <div className="hero-search-in grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-[1.5rem] bg-white/95 p-3 text-ink shadow-panel backdrop-blur md:p-4">
                  <div className="mb-3 flex flex-wrap gap-2" role="group">
                    {[
                      { value: undefined, label: copy.anyPurpose },
                      { value: 'sale' as const, label: copy.sale },
                      { value: 'long_term_rent' as const, label: copy.rent },
                    ].map((option) => (
                      <button
                        aria-pressed={purpose === option.value}
                        className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                          purpose === option.value
                            ? 'bg-ink text-white'
                            : 'bg-surface-muted text-ink hover:bg-primary-soft'
                        }`}
                        key={option.label}
                        onClick={() => setPurpose(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <AreaSearchBar
                      label={copy.area}
                      onSelect={(area) => setAreaId(area.id)}
                    />
                    <Button className="md:min-w-40" onClick={browse}>
                      {copy.search}
                    </Button>
                  </div>
                </div>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/50 bg-white/10 px-6 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-ink"
                  href="/browse"
                >
                  {copy.browseListings} ↓
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-1 md:px-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                {copy.eyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl font-normal md:text-4xl">
                {copy.featured}
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-primary hover:text-primary-strong"
              href="/browse"
            >
              {copy.browseListings} ←
            </Link>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.listings.map((listing, index) => (
              <ScrollReveal delay={index * 90} from="scale" key={listing.id}>
                <PublicListingCard
                  labels={labels}
                  listing={listing}
                  locale={locale}
                />
              </ScrollReveal>
            ))}
          </div>
          {featured.isLoading ? (
            <AsyncState state="loading" title={copy.search} />
          ) : null}
          {featured.error ? (
            <AsyncState
              description={copy.error}
              onRetry={featured.retry}
              retryLabel={copy.retry}
              state="error"
            />
          ) : null}
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-1 md:grid-cols-3 md:px-3">
          {[copy.trustOwner, copy.trustPrivacy, copy.trustReview].map(
            (item, index) => (
              <ScrollReveal delay={index * 80} key={item}>
                <article className="min-h-44 rounded-[1.5rem] bg-surface p-6 shadow-ui">
                  <p className="text-sm font-semibold text-primary">
                    0{index + 1}
                  </p>
                  <h2 className="mt-8 font-display text-2xl font-medium leading-tight">
                    {item}
                  </h2>
                </article>
              </ScrollReveal>
            ),
          )}
        </section>
      </div>
    </main>
  );
}
