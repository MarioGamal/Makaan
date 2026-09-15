import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { PublicListingDetail } from '@makaan/shared/types/marketplace';

import { useLocale } from '../../components/layout/LocaleProvider';
import { ContactButtons } from '../../components/listing/ContactButtons';
import { PublicListingCard } from '../../components/listing/PublicListingCard';
import { SaveButton } from '../../components/listing/SaveButton';
import { Badge, Card } from '../../components/ui';
import {
  ArrowIcon,
  BathIcon,
  BedIcon,
  PinIcon,
  RulerIcon,
  ShieldIcon,
  SparkIcon,
} from '../../components/ui/icons';
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

function GalleryImage({ alt, src }: { alt: string; src: string }) {
  const [broken, setBroken] = useState(false);
  return broken ? (
    <div className="flex h-full items-center justify-center bg-surface-muted text-sm text-ink-subtle">
      {alt}
    </div>
  ) : (
    <img
      alt={alt}
      className="h-full w-full object-cover"
      decoding="async"
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
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  const participation =
    listing.participation === 'verified_owner'
      ? copy.verifiedOwner
      : listing.participation === 'declared_agent'
        ? copy.agent
        : copy.owner;
  const labels = useMemo(
    () => ({
      ...copy,
      verified_owner: copy.verifiedOwner,
      owner_not_verified: copy.owner,
      declared_agent: copy.agent,
    }),
    [copy],
  );

  const facts = [
    {
      icon: <BedIcon className="size-[1.15rem]" />,
      label: copy.bedrooms,
      value: formatNumber(listing.bedrooms, locale),
    },
    {
      icon: <BathIcon className="size-[1.15rem]" />,
      label: copy.bathrooms,
      value: formatNumber(listing.bathrooms, locale),
    },
    {
      icon: <RulerIcon className="size-[1.15rem]" />,
      label: copy.size,
      value: `${formatNumber(listing.sizeSqm, locale)} ${locale === 'ar' ? 'م²' : 'm²'}`,
    },
    {
      icon: <SparkIcon className="size-[1.15rem]" />,
      label: copy.finishing,
      value: finishingLevelLabel(locale, listing.finishingLevel),
    },
  ];

  return (
    <>
      <Head>
        <title>{`${listing.title} · ${area}`}</title>
        <meta content={listing.description?.slice(0, 160)} name="description" />
      </Head>

      <main className="bg-canvas pb-16" id="main-content">
        <div className="mx-auto max-w-content space-y-6 px-4 py-8 sm:px-6 md:py-10">
          <Link
            className="inline-flex min-h-tap items-center gap-2 rounded-pill text-sm font-semibold text-primary transition-colors hover:bg-primary-soft hover:px-3"
            href="/browse"
          >
            <ArrowIcon className="size-4 rotate-180 flip-inline" />
            {copy.back}
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <section className="space-y-3">
              <div className="overflow-hidden rounded-card border border-border bg-surface-muted shadow-ui">
                <div className="aspect-[4/3]">
                  {media[active] ? (
                    <GalleryImage
                      alt={media[active].alt}
                      src={media[active].url}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-subtle">
                      {copy.noImage}
                    </div>
                  )}
                </div>
              </div>

              {media.length > 1 ? (
                <div
                  aria-label={copy.gallery}
                  className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
                  role="group"
                >
                  {media.map((image, index) => (
                    <button
                      aria-current={active === index}
                      aria-label={`${copy.gallery} ${formatNumber(index + 1, locale)}`}
                      className={`h-20 w-28 shrink-0 overflow-hidden rounded-ui border-2 transition-all duration-200 ${
                        active === index
                          ? 'border-primary opacity-100'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      key={`${image.url}-${index}`}
                      onClick={() => setActive(index)}
                      type="button"
                    >
                      <GalleryImage alt={image.alt} src={image.url} />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
              <Card padding="lg" tone="raised">
                <div className="flex flex-wrap items-center gap-2">
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
                  <Badge tone="neutral">
                    {listing.purpose === 'sale' ? copy.sale : copy.rent}
                  </Badge>
                </div>

                <h1 className="mt-4 font-display text-2xl font-semibold md:text-3xl">
                  {listing.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <PinIcon className="size-4 text-primary" />
                  {area} · {propertyTypeLabel(locale, listing.propertyType)}
                </p>

                <p
                  className="mt-5 font-display text-3xl font-semibold text-primary"
                  data-numeric
                >
                  {formatCurrency(listing.priceEgp, locale)}
                  {listing.purpose === 'long_term_rent' ? (
                    <span className="ms-1 text-base font-normal text-ink-muted">
                      {copy.perMonth}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {copy.updated}{' '}
                  {formatDate(
                    listing.availabilityConfirmedAt || listing.publishedAt,
                    locale,
                  )}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-2">
                  {facts.map((fact) => (
                    <div
                      className="rounded-ui bg-surface-muted p-3"
                      key={fact.label}
                    >
                      <dt className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className="text-primary">{fact.icon}</span>
                        {fact.label}
                      </dt>
                      <dd className="mt-1 font-semibold text-ink" data-numeric>
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 grid gap-2">
                  <SaveButton listing={listing} listingId={listing.id} />
                  <ContactButtons listingId={listing.id} />
                </div>
              </Card>

              <Card className="flex gap-3" padding="md">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary"
                >
                  <ShieldIcon className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.locationTrust}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {listing.publicLocation.mode === 'approximate'
                      ? copy.approximate
                      : copy.areaOnlyLocation}
                  </p>
                </div>
              </Card>
            </aside>
          </div>

          <Card padding="lg">
            <h2 className="font-display text-xl font-semibold">
              {copy.description}
            </h2>
            {listing.descriptionSourceLocale === 'ar' && locale === 'en' ? (
              <p className="mt-2 text-sm text-ink-subtle">
                {copy.arabicFallback}
              </p>
            ) : null}
            <p className="mt-4 whitespace-pre-line leading-7 text-ink-muted">
              {listing.description}
            </p>
          </Card>

          <Card padding="lg">
            <h2 className="font-display text-xl font-semibold">{copy.facts}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-ink-muted">{copy.floor}</dt>
                <dd className="mt-1 font-semibold" data-numeric>
                  {listing.floorNumber === null ||
                  listing.floorNumber === undefined
                    ? '—'
                    : formatNumber(listing.floorNumber, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{copy.finishing}</dt>
                <dd className="mt-1 font-semibold">
                  {finishingLevelLabel(locale, listing.finishingLevel)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{copy.amenities}</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {listing.amenities.length ? (
                    listing.amenities.map((amenity) => (
                      <Badge key={amenity} tone="neutral">
                        {amenity}
                      </Badge>
                    ))
                  ) : (
                    <span className="font-semibold">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          {listing.related.length ? (
            <section>
              <h2 className="mb-5 font-display text-xl font-semibold">
                {copy.related}
              </h2>
              <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
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
