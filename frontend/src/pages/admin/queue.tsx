import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AdminProtectedRoute } from '../../components/auth/AdminProtectedRoute';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  getPendingListings,
  type AdminQueueItem,
} from '../../services/admin-auth.service';

type SortMode = 'oldest' | 'newest' | 'highest-price';

export default function AdminModerationQueuePage() {
  const [listings, setListings] = useState<AdminQueueItem[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('oldest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        const result = await getPendingListings();
        setListings(result.listings);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : 'Unable to load moderation queue',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const sortedListings = useMemo(() => {
    const next = [...listings];
    if (sortMode === 'newest') {
      return next.sort((left, right) => (right.submittedAt ?? '').localeCompare(left.submittedAt ?? ''));
    }
    if (sortMode === 'highest-price') {
      return next.sort((left, right) => right.priceEgp - left.priceEgp);
    }
    return next.sort((left, right) => (left.submittedAt ?? '').localeCompare(right.submittedAt ?? ''));
  }, [listings, sortMode]);

  return (
    <AdminProtectedRoute>
      <AdminLayout pendingCount={listings.length}>
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Queue</p>
              <h1 className="mt-2 text-3xl font-semibold">Pending listings</h1>
              <p className="mt-2 text-ink/70">
                Review the oldest submissions first to keep the marketplace fresh.
              </p>
            </div>
            <label className="text-sm">
              <span className="mb-2 block font-medium">Sort</span>
              <select
                className="rounded-2xl border border-ink/10 px-4 py-3"
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                value={sortMode}
              >
                <option value="oldest">Oldest first</option>
                <option value="newest">Newest first</option>
                <option value="highest-price">Highest price</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="mt-6 text-sm text-ink/60">Loading moderation queue...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-clay">{error}</p>
          ) : sortedListings.length === 0 ? (
            <div className="mt-6 rounded-[2rem] bg-sand/40 p-8 text-center">
              <h2 className="text-2xl font-semibold">No pending listings</h2>
              <p className="mt-2 text-ink/70">The moderation queue is clear right now.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-ink/60">
                    <th className="pb-2">Submitted</th>
                    <th className="pb-2">Area</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Seller</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedListings.map((listing) => (
                    <tr className="rounded-2xl bg-sand/30" key={listing.id}>
                      <td className="rounded-l-2xl px-4 py-4 text-sm">
                        {listing.submittedAt
                          ? new Date(listing.submittedAt).toLocaleString()
                          : 'Pending'}
                      </td>
                      <td className="px-4 py-4 text-sm">{listing.area}</td>
                      <td className="px-4 py-4 text-sm">{listing.propertyType}</td>
                      <td className="px-4 py-4 text-sm">
                        EGP {listing.priceEgp.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {(listing.sellerType ?? 'seller').toUpperCase()}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4 text-right text-sm">
                        <Link
                          className="rounded-full bg-ink px-4 py-2 font-semibold text-white"
                          href={`/admin/listings/${listing.id}`}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
