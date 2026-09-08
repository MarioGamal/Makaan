import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { PublicListingSearchResponse } from '@makaan/shared/types/marketplace';

import { HeroSection } from '../components/home/HeroSection';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { SchematicMap } from '../components/map/SchematicMap';
import { AsyncState, Badge, Button, Card, ScrollReveal } from '../components/ui';
import {
  ArrowIcon,
  CloseIcon,
  MapIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
} from '../components/ui/icons';
import { useListings } from '../hooks/useListings';
import { catalogues, formatNumber, translate } from '../i18n';
import { searchListings } from '../services/listings.service';
import { localeFromCookie } from '../utils/locale';

const FEATURED_COUNT = 6;

type HomePageProps = { featured: PublicListingSearchResponse | null };

export default function HomePage({ featured }: HomePageProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

  /*
   * Explore-on-map: a full-screen dialog rather than a section, so the map
   * gets the whole viewport without pushing the landing content around.
   */
  const [selectedMapId, setSelectedMapId] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMapKey, setModalMapKey] = useState(0);
  const [mapResetTrigger, setMapResetTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);
  const mapDialogTitleId = useId();
  const mapDialogRef = useRef<HTMLDivElement>(null);
  const mapTriggerRef = useRef<HTMLButtonElement>(null);
  const mapWasOpenRef = useRef(false);

  const closeMapModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMapId(undefined);
    setModalMapKey((previous) => previous + 1);
    setMapResetTrigger((previous) => previous + 1);
  }, []);

  // The portal only exists after mount; rendering it on the server would not
  // find document.body.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onRouteChange = () => closeMapModal();
    router.events?.on('routeChangeStart', onRouteChange);
    return () => router.events?.off('routeChangeStart', onRouteChange);
  }, [closeMapModal, router.events]);

  // A dialog owns the keyboard while it is open: Escape closes it and Tab
  // cycles inside it.
  useEffect(() => {
    if (!isModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMapModal();
        return;
      }
      if (event.key !== 'Tab' || !mapDialogRef.current) return;
      const focusable = Array.from(
        mapDialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => mapDialogRef.current?.focus());
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMapModal, isModalOpen]);

  // Closing returns focus to the control that opened it.
  useEffect(() => {
    if (mapWasOpenRef.current && !isModalOpen) {
      requestAnimationFrame(() => mapTriggerRef.current?.focus());
    }
    mapWasOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  /** Only fetched once the dialog is open — a closed map costs nothing. */
  const mapListings = useListings(
    isModalOpen ? { locale, page: 1, pageSize: 40, sort: 'newest' } : null,
  );
  const pinnedCount = mapListings.listings.filter(
    (listing) => listing.publicLocation.mode === 'approximate',
  ).length;

  /*
   * The server already rendered these cards. Seeding SWR with that same
   * response means the grid is in the first HTML and only revalidates —
   * when the visitor switches language, for instance — rather than starting
   * empty on the client.
   */
  const live = useListings(
    { locale, page: 1, pageSize: FEATURED_COUNT, sort: 'newest' },
    { fallbackData: featured ?? undefined },
  );
  const listings = live.listings;

  const labels = useMemo(
    () => ({
      ...copy,
      verified_owner: copy.verifiedOwner,
      owner_not_verified: copy.owner,
      declared_agent: copy.agent,
    }),
    [copy],
  );

  const promises = [
    {
      icon: <ShieldIcon className="size-5" />,
      title: copy.trustOwner,
      body: copy.intro,
    },
    {
      icon: <PinIcon className="size-5" />,
      title: copy.trustPrivacy,
      body: copy.approximate,
    },
    {
      icon: <SparkIcon className="size-5" />,
      title: copy.trustReview,
      body: copy.mapDescription,
    },
  ];

  return (
    <>
      <Head>
        <title>{`${translate(locale, 'brand')} · ${copy.eyebrow}`}</title>
        <meta content={copy.intro} name="description" />
      </Head>

      <main className="bg-canvas pb-8" id="main-content">
        <div className="mx-auto max-w-wide space-y-16 px-3 pt-3 md:space-y-24 md:px-4">
          <HeroSection />

          <section className="mx-auto w-full max-w-content">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {copy.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
                  {copy.featured}
                </h2>
              </div>
              <Link
                className="inline-flex min-h-tap items-center gap-2 rounded-pill px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                href="/browse"
              >
                {copy.browseListings}
                <ArrowIcon className="flip-inline size-4" />
              </Link>
            </div>

            {listings.length === 0 && live.isLoading ? (
              <div className="mt-8">
                <AsyncState
                  skeletonCount={FEATURED_COUNT}
                  state="loading"
                  title={copy.search}
                />
              </div>
            ) : listings.length === 0 ? (
              <div className="mt-8">
                <AsyncState
                  description={copy.error}
                  onRetry={live.retry}
                  retryLabel={copy.retry}
                  state="error"
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {listings.slice(0, FEATURED_COUNT).map((listing, index) => (
                  <ScrollReveal
                    delay={(index % 3) * 80}
                    from="scale"
                    key={listing.id}
                  >
                    <PublicListingCard
                      labels={labels}
                      listing={listing}
                      locale={locale}
                      priority={index < 3}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </section>

          <section className="mx-auto grid w-full max-w-content gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <ScrollReveal className="h-fit lg:sticky lg:top-28" from="start">
              <p className="text-sm font-semibold text-primary">
                {copy.trustTitle}
              </p>
              <h2 className="mt-3 max-w-md font-display text-3xl font-semibold leading-[1.15] md:text-4xl">
                {copy.headline}
              </h2>
              <p className="mt-4 max-w-md text-ink-muted">{copy.intro}</p>
              <Link
                className="mt-6 inline-flex min-h-tap items-center gap-2 rounded-pill bg-primary px-6 text-sm font-semibold text-white shadow-ui transition-all duration-200 hover:bg-primary-strong hover:shadow-panel"
                href="/browse"
              >
                {copy.search}
                <ArrowIcon className="flip-inline size-4" />
              </Link>
            </ScrollReveal>

            <div className="grid gap-4">
              {promises.map((promise, index) => (
                <ScrollReveal delay={index * 70} key={promise.title}>
                  <Card
                    as="article"
                    className="flex gap-4"
                    padding="lg"
                    tone="raised"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-panel bg-primary-soft text-primary"
                    >
                      {promise.icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink-subtle">
                        0{index + 1}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-semibold">
                        {promise.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {promise.body}
                      </p>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-content">
            <ScrollReveal from="scale">
              <div className="rounded-hero bg-brand-sheen px-6 py-12 text-center text-white shadow-float md:px-12 md:py-16">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold md:text-4xl">
                  {translate(locale, 'navigation.sell')}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/85">
                  {translate(locale, 'shell.footerDescription')}
                </p>
                <Link
                  className="mt-8 inline-flex min-h-tap items-center gap-2 rounded-pill bg-white px-7 text-sm font-semibold text-primary shadow-ui transition-transform duration-200 hover:scale-[1.02]"
                  href="/auth/login"
                >
                  {translate(locale, 'navigation.signIn')}
                  <ArrowIcon className="flip-inline size-4" />
                </Link>
              </div>
            </ScrollReveal>
          </section>
        </div>

        {/*
          The map opens over the page rather than inside it, so it gets the
          whole viewport instead of competing with the landing content.
        */}
        {mounted && isModalOpen
          ? createPortal(
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/55 p-3 backdrop-blur-sm"
                onClick={closeMapModal}
              >
                <div
                  aria-labelledby={mapDialogTitleId}
                  aria-modal="true"
                  className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-card border border-border bg-surface shadow-float md:h-[85vh]"
                  onClick={(event) => event.stopPropagation()}
                  ref={mapDialogRef}
                  role="dialog"
                  tabIndex={-1}
                >
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <h2
                        className="font-display text-base font-semibold sm:text-lg"
                        id={mapDialogTitleId}
                      >
                        {copy.map}
                      </h2>
                      {pinnedCount > 0 ? (
                        <Badge size="sm" tone="neutral">
                          <span data-numeric>
                            {formatNumber(pinnedCount, locale)}
                          </span>{' '}
                          {copy.pinnedLocations}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setSelectedMapId(undefined);
                          setMapResetTrigger((previous) => previous + 1);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        {copy.resetMap}
                      </Button>
                      <Link
                        className="inline-flex min-h-tap items-center gap-1.5 rounded-pill border border-border bg-surface-raised px-4 text-xs font-semibold text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
                        href="/browse?view=map"
                        onClick={closeMapModal}
                      >
                        {copy.browseListings}
                        <ArrowIcon className="flip-inline size-4" />
                      </Link>
                      <Button
                        aria-label={copy.closeMap}
                        icon={<CloseIcon className="size-[1.1rem]" />}
                        iconOnly
                        onClick={closeMapModal}
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </div>

                  <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                    <SchematicMap
                      className="h-full w-full rounded-none border-0 shadow-none"
                      height="100%"
                      key={`modal-map-${modalMapKey}`}
                      labels={labels}
                      listings={mapListings.listings}
                      locale={locale}
                      onReset={() => setSelectedMapId(undefined)}
                      onSelect={setSelectedMapId}
                      resetTrigger={mapResetTrigger}
                      selectedId={selectedMapId}
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}

        {/* The way into the map, parked above the fold on every scroll position. */}
        {mounted && !isModalOpen ? (
          <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
            <button
              className="inline-flex min-h-tap items-center gap-2.5 rounded-pill bg-ink px-6 text-sm font-semibold text-on-ink shadow-float transition-transform duration-300 ease-spring hover:scale-105 active:scale-95"
              data-testid="show-map"
              onClick={() => {
                setSelectedMapId(undefined);
                setMapResetTrigger((previous) => previous + 1);
                setIsModalOpen(true);
              }}
              ref={mapTriggerRef}
              type="button"
            >
              {copy.showMap}
              <MapIcon className="size-4" />
            </button>
          </div>
        ) : null}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async (
  context,
) => {
  const locale = localeFromCookie(context.req.headers.cookie);
  try {
    const response = await searchListings({
      locale,
      page: 1,
      pageSize: FEATURED_COUNT,
      sort: 'newest',
    });
    return { props: { featured: response } };
  } catch {
    // The landing page still renders without the API; the grid retries.
    return { props: { featured: null } };
  }
};
