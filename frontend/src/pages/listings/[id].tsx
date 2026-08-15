import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import type { PublicListingDetail } from '@makaan/shared/types/marketplace';
import { useLocale } from '../../components/layout/LocaleProvider';
import { ContactButtons } from '../../components/listing/ContactButtons';
import { PublicListingCard } from '../../components/listing/PublicListingCard';
import { SaveButton } from '../../components/listing/SaveButton';
import { Badge, Card } from '../../components/ui';
import {
  catalogues,
  formatCurrency,
  formatDate,
  formatNumber,
  finishingLevelLabel,
  propertyTypeLabel,
} from '../../i18n';
import { getListingById } from '../../services/listings.service';
import { localeFromCookie } from '../../utils/locale';

function Image({ alt, src }: { alt: string; src: string }) {
  const [broken, setBroken] = useState(false);
  return broken ? (
    <div className="flex h-full items-center justify-center bg-surface-muted text-sm text-ink-muted">
      {alt}
    </div>
  ) : (
    <img
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
      src={src}
    />
  );
}

export default function ListingDetailPage({
  listing,
}: {
  listing: PublicListingDetail;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [active, setActive] = useState(0);
  const media = listing.media.length
    ? listing.media
    : listing.coverImage
      ? [listing.coverImage]
      : [];
  const participation =
    listing.participation === 'verified_owner'
      ? copy.verifiedOwner
      : listing.participation === 'declared_agent'
        ? copy.agent
        : copy.owner;
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  const labels = {
    ...copy,
    verified_owner: copy.verifiedOwner,
    owner_not_verified: copy.owner,
    declared_agent: copy.agent,
  };
  return (
    <main className="bg-canvas py-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 md:px-8">
        <Link className="text-sm font-semibold text-primary" href="/browse">
          ← {copy.back}
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <section className="space-y-3">
            <Card className="overflow-hidden p-0">
              <div className="aspect-[4/3] bg-surface-muted">
                {media[active] ? (
                  <Image alt={media[active].alt} src={media[active].url} />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-muted">
                    {copy.noImage}
                  </div>
                )}
              </div>
            </Card>
            {media.length > 1 ? (
              <div
                aria-label={copy.gallery}
                className="flex gap-2 overflow-x-auto"
              >
                {media.map((image, index) => (
                  <button
                    aria-label={`${copy.gallery} ${index + 1}`}
                    className={`h-20 w-24 shrink-0 overflow-hidden rounded-ui border ${active === index ? 'border-primary' : 'border-border'}`}
                    key={`${image.url}-${index}`}
                    onClick={() => setActive(index)}
                    type="button"
                  >
                    <Image alt={image.alt} src={image.url} />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
          <aside className="space-y-5">
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">
                    {area} · {propertyTypeLabel(locale, listing.propertyType)}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-primary md:text-3xl">
                    {listing.title}
                  </h1>
                </div>
                <Badge
                  tone={
                    listing.participation === 'verified_owner'
                      ? 'success'
                      : listing.participation === 'declared_agent'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {participation}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-bold">
                {formatCurrency(listing.priceEgp, locale)}
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {copy.updated}{' '}
                {formatDate(
                  listing.availabilityConfirmedAt || listing.publishedAt,
                  locale,
                )}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-ui bg-surface-muted p-3">
                  {formatNumber(listing.sizeSqm, locale)} م²
                </div>
                <div className="rounded-ui bg-surface-muted p-3">
                  {formatNumber(listing.bedrooms, locale)} {copy.bedrooms}
                </div>
                <div className="rounded-ui bg-surface-muted p-3">
                  {formatNumber(listing.bathrooms, locale)} {copy.bathrooms}
                </div>
                <div className="rounded-ui bg-surface-muted p-3">
                  {finishingLevelLabel(locale, listing.finishingLevel)}
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                <SaveButton listingId={listing.id} />
                <ContactButtons listingId={listing.id} />
              </div>
            </Card>
            <Card>
              <h2 className="font-bold">{copy.locationTrust}</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {listing.publicLocation.mode === 'approximate'
                  ? copy.approximate
                  : copy.areaOnlyLocation}
              </p>
            </Card>
          </aside>
        </div>
        <Card padding="lg">
          <h2 className="text-xl font-bold">{copy.description}</h2>
          {listing.descriptionSourceLocale === 'ar' && locale === 'en' ? (
            <p className="mt-2 text-sm text-ink-muted">{copy.arabicFallback}</p>
          ) : null}
          <p className="mt-4 whitespace-pre-line text-ink-muted">
            {listing.description}
          </p>
        </Card>
        <Card padding="lg">
          <h2 className="text-xl font-bold">{copy.facts}</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-ink-muted">{copy.floor}</dt>
              <dd>{listing.floorNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">{copy.finishing}</dt>
              <dd>{finishingLevelLabel(locale, listing.finishingLevel)}</dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">{copy.amenities}</dt>
              <dd>
                {listing.amenities.length ? listing.amenities.join(' · ') : '—'}
              </dd>
            </div>
          </dl>
        </Card>
        {listing.related.length ? (
          <section>
            <h2 className="mb-4 text-xl font-bold">{copy.related}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listing.related.map((item) => (
                <PublicListingCard
                  key={item.id}
                  labels={labels}
                  listing={item}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id;
  if (typeof id !== 'string') return { notFound: true };
  try {
    const locale = localeFromCookie(context.req.headers.cookie);
    const listing = await getListingById(id, locale);
    return { props: { listing } };
  } catch {
    return { notFound: true };
  }
};
