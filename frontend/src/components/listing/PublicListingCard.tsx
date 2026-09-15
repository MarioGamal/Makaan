import Link from 'next/link';
import { memo, useState } from 'react';

import type {
  ParticipationLabel,
  PublicListingCard as Listing,
} from '@makaan/shared/types/marketplace';

import {
  formatCurrency,
  formatNumber,
  propertyTypeLabel,
  type Locale,
} from '../../i18n';
import { Badge } from '../ui';
import { BathIcon, BedIcon, PinIcon, RulerIcon } from '../ui/icons';

import { SaveToggle } from './SaveToggle';

const participationTone: Record<
  ParticipationLabel,
  'success' | 'info' | 'warning'
> = {
  verified_owner: 'success',
  owner_not_verified: 'info',
  declared_agent: 'warning',
};

const NEW_LISTING_DAYS = 7;

function isRecent(publishedAt: string) {
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return false;
  return Date.now() - published < NEW_LISTING_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * The property card.
 *
 * The whole surface is one link to the detail page, with the save control
 * lifted out of it so the two never fight for the same tap. Everything above
 * the fold of the card — price, place, size — comes from the public listing
 * projection; nothing here can reveal an exact location or a contact.
 *
 * `priority` marks the cards that are visible without scrolling: those load
 * their photograph eagerly, the rest stay lazy.
 */
function PublicListingCardComponent({
  listing,
  locale,
  labels,
  priority = false,
}: {
  listing: Listing;
  locale: Locale;
  labels: Record<string, string>;
  priority?: boolean;
}) {
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = Boolean(listing.coverImage) && !imageBroken;
  const facts = [
    {
      icon: <BedIcon className="size-4" />,
      value: `${formatNumber(listing.bedrooms, locale)} ${labels.bedrooms}`,
    },
    {
      icon: <BathIcon className="size-4" />,
      value: `${formatNumber(listing.bathrooms, locale)} ${labels.bathrooms}`,
    },
    {
      icon: <RulerIcon className="size-4" />,
      value: `${formatNumber(listing.sizeSqm, locale)} ${locale === 'ar' ? 'م²' : 'm²'}`,
    },
  ];

  return (
    <article
      className="group relative flex h-full flex-col"
      data-listing-id={listing.id}
      data-testid="listing-card"
    >
      <div className="relative overflow-hidden rounded-card bg-surface-muted shadow-ui">
        <div className="aspect-[4/3]">
          {showImage && listing.coverImage ? (
            <img
              alt={listing.coverImage.alt}
              className="h-full w-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.06]"
              // Intrinsic dimensions reserve the space before the bytes land.
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              height={listing.coverImage.height}
              loading={priority ? 'eager' : 'lazy'}
              onError={() => setImageBroken(true)}
              src={listing.coverImage.url}
              width={listing.coverImage.width}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-subtle">
              {labels.noImage}
            </div>
          )}
        </div>

        {/* Sits above the link layer so a tap on the heart never navigates. */}
        <div className="absolute end-3 top-3 z-20">
          <SaveToggle listing={listing} />
        </div>

        <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-wrap gap-1.5">
          <Badge className="glass-strong" size="sm" tone="glass">
            {listing.purpose === 'sale' ? labels.sale : labels.rent}
          </Badge>
          {isRecent(listing.publishedAt) ? (
            <Badge size="sm" tone="brand">
              {labels.newBadge}
            </Badge>
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-3 start-3 z-10">
          <Badge className="glass-strong" size="sm" tone="glass">
            {listing.publicLocation.mode === 'approximate'
              ? labels.approximateBadge
              : labels.areaOnlyBadge}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <p
            className="font-display text-xl font-semibold tracking-tight text-ink"
            data-numeric
          >
            {formatCurrency(listing.priceEgp, locale)}
            {listing.purpose === 'long_term_rent' ? (
              <span className="ms-1 text-sm font-normal text-ink-muted">
                {labels.perMonth}
              </span>
            ) : null}
          </p>
          <Badge size="sm" tone={participationTone[listing.participation]}>
            {labels[listing.participation]}
          </Badge>
        </div>

        {/*
         * The stretched link covers the card without wrapping it, which keeps
         * the heart clickable and leaves one link per card for screen readers.
         */}
        <h3 className="line-clamp-1 text-base font-semibold text-ink">
          <Link
            className="after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:shadow-none"
            data-testid="listing-card-link"
            href={`/listings/${listing.id}`}
          >
            {listing.title}
          </Link>
        </h3>

        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <PinIcon className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {area} · {propertyTypeLabel(locale, listing.propertyType)}
          </span>
        </p>

        <ul className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm text-ink-muted">
          {facts.map((fact) => (
            <li className="flex items-center gap-1.5" key={fact.value}>
              <span className="text-ink-subtle">{fact.icon}</span>
              <span data-numeric>{fact.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * Memoised because a map drag or a filter keystroke re-renders the results
 * grid; a card whose listing has not changed should not re-render with it.
 */
export const PublicListingCard = memo(PublicListingCardComponent);
