import Link from 'next/link';
import { useState } from 'react';

import type {
  ParticipationLabel,
  PublicListingCard as Listing,
} from '@makaan/shared/types/marketplace';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  propertyTypeLabel,
  type Locale,
} from '../../i18n';
import { Badge, Card } from '../ui';

const participationTone: Record<
  ParticipationLabel,
  'success' | 'info' | 'warning'
> = {
  verified_owner: 'success',
  owner_not_verified: 'info',
  declared_agent: 'warning',
};

export function PublicListingCard({
  listing,
  locale,
  labels,
}: {
  listing: Listing;
  locale: Locale;
  labels: Record<string, string>;
}) {
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  const label = labels[listing.participation];
  const [imageBroken, setImageBroken] = useState(false);
  return (
    <Card
      as="article"
      className="group overflow-hidden border-0 bg-transparent p-0 shadow-none"
    >
      <Link
        aria-label={listing.title}
        className="block"
        href={`/listings/${listing.id}`}
      >
        <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-surface-muted">
          {listing.coverImage && !imageBroken ? (
            <img
              alt={listing.coverImage.alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              onError={() => setImageBroken(true)}
              src={listing.coverImage.url}
            />
          ) : (
            <div
              aria-label={labels.noImage}
              className="flex h-full items-center justify-center text-sm text-ink-muted"
            >
              {labels.noImage}
            </div>
          )}
        </div>
        <div className="space-y-3 px-2 py-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xl font-semibold tracking-tight text-primary">
              {formatCurrency(listing.priceEgp, locale)}
            </p>
            <Badge tone={participationTone[listing.participation]}>
              {label}
            </Badge>
          </div>
          <h2 className="line-clamp-1 text-lg font-semibold">
            {listing.title}
          </h2>
          <p className="text-sm text-ink-muted">
            {area} · {propertyTypeLabel(locale, listing.propertyType)}
          </p>
          <p className="text-sm text-ink-muted">
            {formatNumber(listing.sizeSqm, locale)} م² ·{' '}
            {formatNumber(listing.bedrooms, locale)} {labels.bedrooms} ·{' '}
            {formatNumber(listing.bathrooms, locale)} {labels.bathrooms}
          </p>
          <p className="text-xs text-ink-muted">
            {labels.updated}{' '}
            {formatDate(
              listing.availabilityConfirmedAt || listing.publishedAt,
              locale,
            )}
          </p>
        </div>
      </Link>
    </Card>
  );
}
