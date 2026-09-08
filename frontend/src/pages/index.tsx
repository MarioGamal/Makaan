import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';

import type { PublicListingSearchResponse } from '@makaan/shared/types/marketplace';

import { HeroSection } from '../components/home/HeroSection';
import { useLocale } from '../components/layout/LocaleProvider';
import { PublicListingCard } from '../components/listing/PublicListingCard';
import { AsyncState, Card, ScrollReveal } from '../components/ui';
import {
  ArrowIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
} from '../components/ui/icons';
import { useListings } from '../hooks/useListings';
import { catalogues, translate } from '../i18n';
import { searchListings } from '../services/listings.service';
import { localeFromCookie } from '../utils/locale';

const FEATURED_COUNT = 6;

type HomePageProps = { featured: PublicListingSearchResponse | null };

export default function HomePage({ featured }: HomePageProps) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

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
