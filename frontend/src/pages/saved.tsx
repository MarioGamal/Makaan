import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SaveButton } from '../components/listing/SaveButton';
import {
  fetchSavedListings,
  getSavedIds,
  subscribeToSavedListings,
  type SavedListingCard,
} from '../services/saved.service';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(price);

export default function SavedListingsPage() {
  const [listings, setListings] = useState<SavedListingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const ids = getSavedIds();
        const savedListings = await fetchSavedListings(ids);
        setListings(savedListings);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load saved listings');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    return subscribeToSavedListings(() => {
      void load();
    });
  }, []);

  return (
    <main className="min-h-screen bg-sand px-4 py-6 text-ink md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Saved</p>
            <h1 className="mt-2 text-3xl font-semibold">Saved listings</h1>
          </div>
          <Link className="text-sm text-oasis" href="/">
            Browse listings
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-sm text-ink/60">Loading saved listings...</p>
        ) : error ? (
          <p className="mt-8 text-sm text-clay">{error}</p>
        ) : listings.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-semibold">No saved listings yet</h2>
            <p className="mt-2 text-ink/70">
              Save a few homes from the map or detail page and they will show up here.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
              href="/"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <article
                className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-sm"
                key={listing.id}
              >
                <Link className="block" href={`/listings/${listing.id}`}>
                  <div className="aspect-[4/3] bg-stone-200">
                    {listing.thumbnail_url ? (
                      <img
                        alt={listing.title}
                        className="h-full w-full object-cover"
                        src={listing.thumbnail_url}
                      />
                    ) : null}
                  </div>
                </Link>
                <div className="space-y-3 p-5">
                  <div>
                    <p className="text-lg font-semibold">{formatPrice(listing.price)}</p>
                    <p className="mt-1 text-sm text-ink/70">{listing.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-oasis">
                      {listing.area_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      className="flex-1 rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-white"
                      href={`/listings/${listing.id}`}
                    >
                      View details
                    </Link>
                    <SaveButton listingId={listing.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
