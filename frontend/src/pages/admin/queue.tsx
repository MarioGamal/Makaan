import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { AdminProtectedRoute } from '../../components/auth/AdminProtectedRoute';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AsyncState } from '../../components/ui/AsyncState';
import { Badge } from '../../components/ui/Badge';
import { useLocale } from '../../components/layout/LocaleProvider';
import { moderationCopy } from '../../i18n/moderation';
import {
  getPendingListings,
  type AdminQueueItem,
  type Participation,
} from '../../services/admin-auth.service';

type SortMode = 'oldest' | 'newest' | 'highest-price';
const participationTones: Record<
  Participation,
  'success' | 'warning' | 'info'
> = {
  verified_owner: 'success',
  owner_not_verified: 'warning',
  declared_agent: 'info',
};

export default function AdminModerationQueuePage() {
  const { locale } = useLocale();
  const copy = moderationCopy[locale];
  const [listings, setListings] = useState<AdminQueueItem[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('oldest');
  const [participation, setParticipation] = useState<Participation | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getPendingListings({
        participation: participation || undefined,
      });
      setListings(result.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.loading);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [participation]);

  const sortedListings = useMemo(
    () =>
      [...listings].sort((left, right) => {
        if (sortMode === 'highest-price') return right.priceEgp - left.priceEgp;
        const direction = sortMode === 'newest' ? -1 : 1;
        return (
          direction *
          (left.submittedAt ?? '').localeCompare(right.submittedAt ?? '')
        );
      }),
    [listings, sortMode],
  );
  const areaName = (item: AdminQueueItem) =>
    locale === 'ar'
      ? item.area.nameAr || item.area.nameEn || 'القاهرة'
      : item.area.nameEn || item.area.nameAr || 'Cairo';

  return (
    <AdminProtectedRoute>
      <AdminLayout pendingCount={listings.length}>
        <section className="rounded-panel border border-border bg-surface-raised p-5 shadow-panel md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.24em] text-ink/55">
                {copy.queue}
              </p>
              <h1 className="mt-2 text-3xl font-bold">{copy.pending}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                <span className="mb-1.5 block">{copy.participation}</span>
                <select
                  className="min-h-11 w-full rounded-ui border border-border bg-white px-3"
                  value={participation}
                  onChange={(event) =>
                    setParticipation(event.target.value as Participation | '')
                  }
                >
                  <option value="">{copy.all}</option>
                  <option value="verified_owner">{copy.verified_owner}</option>
                  <option value="owner_not_verified">
                    {copy.owner_not_verified}
                  </option>
                  <option value="declared_agent">{copy.declared_agent}</option>
                </select>
              </label>
              <label className="text-sm font-semibold">
                <span className="mb-1.5 block">{copy.queue}</span>
                <select
                  className="min-h-11 w-full rounded-ui border border-border bg-white px-3"
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as SortMode)
                  }
                >
                  <option value="oldest">{copy.oldest}</option>
                  <option value="newest">{copy.newest}</option>
                  <option value="highest-price">{copy.price}</option>
                </select>
              </label>
            </div>
          </div>
          <div className="mt-6">
            {isLoading ? (
              <AsyncState state="loading" title={copy.loading} />
            ) : error ? (
              <AsyncState
                state="error"
                title={error}
                onRetry={() => void load()}
                retryLabel={copy.retry}
              />
            ) : sortedListings.length === 0 ? (
              <AsyncState state="empty" title={copy.clear} />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full border-separate border-spacing-y-2 text-start">
                  <thead className="text-xs font-bold uppercase tracking-wide text-ink/55">
                    <tr>
                      <th className="px-3 pb-2 text-start">{copy.submitted}</th>
                      <th className="px-3 pb-2 text-start">{copy.area}</th>
                      <th className="px-3 pb-2 text-start">{copy.type}</th>
                      <th className="px-3 pb-2 text-start">{copy.price}</th>
                      <th className="px-3 pb-2 text-start">
                        {copy.participation}
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedListings.map((listing) => (
                      <tr className="bg-surface-muted" key={listing.id}>
                        <td className="rounded-s-ui px-3 py-4 text-sm">
                          {listing.submittedAt
                            ? new Intl.DateTimeFormat(
                                locale === 'ar' ? 'ar-EG' : 'en-EG',
                                { dateStyle: 'medium', timeStyle: 'short' },
                              ).format(new Date(listing.submittedAt))
                            : '—'}
                        </td>
                        <td className="px-3 py-4 text-sm font-semibold">
                          {areaName(listing)}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          {listing.propertyType}
                          <span className="mt-1 block text-xs text-ink/55">
                            {copy[listing.purpose]}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm font-semibold">
                          {new Intl.NumberFormat(
                            locale === 'ar' ? 'ar-EG' : 'en-EG',
                          ).format(listing.priceEgp)}{' '}
                          EGP
                        </td>
                        <td className="px-3 py-4">
                          <Badge
                            tone={participationTones[listing.participation]}
                          >
                            {copy[listing.participation]}
                          </Badge>
                        </td>
                        <td className="rounded-e-ui px-3 py-4 text-end">
                          <Link
                            className="inline-flex min-h-11 items-center rounded-ui bg-primary px-4 text-sm font-bold text-white"
                            href={`/admin/listings/${listing.id}`}
                          >
                            {copy.open}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
