import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';

import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { AsyncState, Card } from '../components/ui';
import { ArrowIcon, HeartIcon } from '../components/ui/icons';
import { useSavedListings } from '../hooks/useSavedListings';
import { catalogues, formatNumber, translate } from '../i18n';

export default function SavedListingsPage() {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const { listings, isLoading, error, retry } = useSavedListings();

  const labels = useMemo(
    () => ({
      ...copy,
      verified_owner: copy.verifiedOwner,
      owner_not_verified: copy.owner,
      declared_agent: copy.agent,
    }),
    [copy],
  );

  return (
    <>
      <Head>
        <title>{`${copy.savedTitle} · ${translate(locale, 'brand')}`}</title>
        <meta content="noindex" name="robots" />
      </Head>

      <main className="bg-canvas pb-16" id="main-content">
        <div className="mx-auto max-w-content px-4 py-10 sm:px-6 md:py-14">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                {copy.savedEyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
                {copy.savedTitle}
              </h1>
              {listings.length > 0 ? (
                <p className="mt-2 text-sm text-ink-muted" data-numeric>
                  {formatNumber(listings.length, locale)} {copy.results}
                </p>
              ) : null}
            </div>
            <Link
              className="inline-flex min-h-tap items-center gap-2 rounded-pill px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              href="/browse"
            >
              {copy.browseListings}
              <ArrowIcon className="flip-inline size-4" />
            </Link>
          </header>

          <div className="mt-8">
            {isLoading ? (
              <AsyncState
                skeletonCount={3}
                state="loading"
                title={copy.savedLoading}
              />
            ) : error ? (
              <AsyncState
                description={copy.savedError}
                onRetry={retry}
                retryLabel={copy.retry}
                state="error"
              />
            ) : listings.length === 0 ? (
              <Card
                className="mx-auto max-w-lg text-center"
                padding="lg"
                tone="raised"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto grid size-12 place-items-center rounded-pill bg-primary-soft text-primary"
                >
                  <HeartIcon className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold">
                  {copy.savedEmptyTitle}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {copy.savedEmptyDescription}
                </p>
                <Link
                  className="mt-6 inline-flex min-h-tap items-center rounded-pill bg-primary px-5 text-sm font-semibold text-white shadow-ui"
                  href="/browse"
                >
                  {copy.browseListings}
                </Link>
              </Card>
            ) : (
              <div
                className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="saved-results"
              >
                {/* The heart on each card removes it: one control, one place. */}
                {listings.map((listing, index) => (
                  <PublicListingCard
                    key={listing.id}
                    labels={labels}
                    listing={listing}
                    locale={locale}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
