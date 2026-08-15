import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { PublicListingCard as Listing } from '@makaan/shared/types/marketplace';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { SaveButton } from '../components/listing/SaveButton';
import { catalogues } from '../i18n';
import { fetchSavedListings } from '../services/saved.service';

export default function SavedListingsPage() {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(false);
      setListings(await fetchSavedListings());
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []); // The anonymous cookie is established once on page load.

  const labels = {
    ...copy,
    verified_owner: copy.verifiedOwner,
    owner_not_verified: copy.owner,
    declared_agent: copy.agent,
  };
  return (
    <main className="min-h-screen bg-canvas py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {copy.savedEyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{copy.savedTitle}</h1>
          </div>
          <Link className="text-sm font-semibold text-primary" href="/browse">
            {copy.browseListings}
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-ink-muted" role="status">
            {copy.savedLoading}
          </p>
        ) : error ? (
          <div className="mt-8 space-y-3 text-sm text-danger" role="alert">
            <p>{copy.savedError}</p>
            <button
              className="font-semibold text-primary"
              onClick={() => void load()}
              type="button"
            >
              {copy.retry}
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-ui border border-border bg-surface-raised p-10 text-center shadow-ui">
            <h2 className="text-2xl font-bold">{copy.savedEmptyTitle}</h2>
            <p className="mt-2 text-ink-muted">{copy.savedEmptyDescription}</p>
            <Link
              className="mt-6 inline-flex rounded-ui bg-primary px-4 py-3 text-sm font-semibold text-white"
              href="/browse"
            >
              {copy.browseListings}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <div className="space-y-2" key={listing.id}>
                <PublicListingCard
                  labels={labels}
                  listing={listing}
                  locale={locale}
                />
                <SaveButton
                  compact
                  listingId={listing.id}
                  onSavedChange={(saved) => {
                    if (!saved)
                      setListings((current) =>
                        current.filter((item) => item.id !== listing.id),
                      );
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
