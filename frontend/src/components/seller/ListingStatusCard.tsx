import Link from 'next/link';
import { useLocale } from '../layout/LocaleProvider';
import { sellerCopy } from '../../i18n/seller';
import { formatCurrency, formatNumber } from '../../i18n';
import type { SellerManagedListing } from '../../services/listings.service';
import { Badge, Button, Card } from '../ui';

const tones: Record<
  string,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  rejected: 'danger',
  sold: 'info',
  inactive: 'neutral',
  expired: 'neutral',
};
export function ListingStatusCard({
  listing,
  onMarkInactive,
  onMarkSold,
}: {
  listing: SellerManagedListing;
  onMarkInactive: (id: string) => void;
  onMarkSold: (id: string) => void;
}) {
  const { locale } = useLocale();
  const copy = sellerCopy[locale];
  const editable = ['draft', 'rejected'].includes(listing.status);
  const status = copy[listing.status] ?? listing.status;
  return (
    <Card as="article" padding="none" className="overflow-hidden">
      <div className="grid gap-5 p-4 md:grid-cols-[190px_minmax(0,1fr)] md:p-5">
        <div className="aspect-[4/3] overflow-hidden rounded-ui bg-surface-muted">
          {listing.thumbnailUrl ? (
            <img
              alt={listing.title}
              className="h-full w-full object-cover"
              src={listing.thumbnailUrl}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-muted">
              {copy.photos}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-muted">
                {(locale === 'ar'
                  ? listing.area?.nameAr
                  : listing.area?.nameEn) ??
                  (locale === 'ar' ? 'القاهرة' : 'Cairo')}{' '}
                ·{' '}
                {listing.participation === 'declared_agent'
                  ? copy.agent
                  : listing.participation === 'verified_owner'
                    ? copy.verified
                    : copy.owner}
              </p>
              <h2 className="mt-1 text-xl font-bold">{listing.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {formatCurrency(listing.priceEgp, locale)} ·{' '}
                {formatNumber(listing.sizeSqm, locale)} م²
              </p>
            </div>
            <Badge tone={tones[listing.status] ?? 'neutral'}>{status}</Badge>
          </div>
          {listing.status === 'rejected' ? (
            <div className="mt-4 rounded-ui bg-red-50 p-3 text-sm text-danger">
              <strong>{copy.rejectionLabel}: </strong>
              {copy[listing.rejectionReason ?? ''] ?? listing.rejectionReason}
              <p className="mt-1">{listing.moderatorNote || copy.feedback}</p>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-ui bg-surface-muted p-3 text-sm sm:grid-cols-4">
            <span>
              {copy.views}: {listing.metrics.viewCount}
            </span>
            <span>
              {copy.saves}: {listing.metrics.saveCount}
            </span>
            <span>
              {copy.contacts}: {listing.metrics.contactCount}
            </span>
            <span>
              {copy.days}: {listing.metrics.daysListed}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {editable ? (
              <Link href={`/listings/${listing.id}/edit`}>
                <Button size="sm">
                  {listing.status === 'rejected'
                    ? copy.resubmit
                    : copy.continue}
                </Button>
              </Link>
            ) : null}
            {listing.status === 'active' ? (
              <>
                <Button
                  onClick={() => onMarkInactive(listing.id)}
                  size="sm"
                  variant="secondary"
                >
                  {copy.withdraw}
                </Button>
                <Button
                  onClick={() => onMarkSold(listing.id)}
                  size="sm"
                  variant="secondary"
                >
                  {copy.markSold}
                </Button>
                <Link href={`/listings/${listing.id}`}>
                  <Button size="sm" variant="quiet">
                    {copy.publicPage}
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
