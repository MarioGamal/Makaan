import Link from 'next/link';

import type { SellerManagedListing } from '../../services/listings.service';

const statusStyles: Record<string, string> = {
  draft: 'bg-stone-200 text-stone-800',
  submitted: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  sold: 'bg-fuchsia-100 text-fuchsia-800',
  inactive: 'bg-slate-200 text-slate-800',
};

const rejectionCopy: Record<string, string> = {
  incomplete_data: 'Complete the missing details and resubmit.',
  inaccurate_location: 'Move the map pin to the precise property location.',
  duplicate: 'This looks too similar to another listing already in review or live.',
  spam_scam: 'The moderation team flagged this listing as misleading or unsafe.',
};

type ListingStatusCardProps = {
  listing: SellerManagedListing;
  onMarkInactive: (listingId: string) => void;
  onMarkSold: (listingId: string) => void;
};

export function ListingStatusCard({
  listing,
  onMarkInactive,
  onMarkSold,
}: ListingStatusCardProps) {
  const isEditable = listing.status === 'draft' || listing.status === 'rejected';

  return (
    <article className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-sm">
      <div className="grid gap-4 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-stone-200">
          {listing.thumbnailUrl ? (
            <img
              alt={listing.title}
              className="h-full w-full object-cover"
              src={listing.thumbnailUrl}
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
                {listing.area.nameEn ?? 'Cairo'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{listing.title}</h2>
              <p className="mt-2 text-sm text-ink/70">
                EGP {listing.priceEgp.toLocaleString()} · {listing.bedrooms} bd · {listing.bathrooms} ba ·{' '}
                {listing.sizeSqm} sqm
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                statusStyles[listing.status] ?? 'bg-slate-100 text-slate-700'
              }`}
            >
              {listing.status}
            </span>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] bg-sand/50 p-4 text-sm md:grid-cols-4">
            <p>Views: {listing.metrics.viewCount}</p>
            <p>Saves: {listing.metrics.saveCount}</p>
            <p>Contacts: {listing.metrics.contactCount}</p>
            <p>Days listed: {listing.metrics.daysListed}</p>
          </div>

          {listing.status === 'rejected' ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <p className="font-semibold">
                Rejected: {(listing.rejectionReason ?? 'review issue').replace(/_/g, ' ')}
              </p>
              <p className="mt-2">
                {rejectionCopy[listing.rejectionReason ?? ''] ??
                  'Update the listing and submit it again for review.'}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isEditable ? (
              <Link
                className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                href={`/listings/${listing.id}/edit`}
              >
                {listing.status === 'rejected' ? 'Edit & Resubmit' : 'Continue editing'}
              </Link>
            ) : null}
            {listing.status === 'active' ? (
              <>
                <button
                  className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold"
                  onClick={() => onMarkInactive(listing.id)}
                  type="button"
                >
                  Mark inactive
                </button>
                <button
                  className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold"
                  onClick={() => onMarkSold(listing.id)}
                  type="button"
                >
                  Mark sold
                </button>
              </>
            ) : null}
            {listing.status === 'active' ? (
              <Link
                className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold"
                href={`/listings/${listing.id}`}
              >
                View public page
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
