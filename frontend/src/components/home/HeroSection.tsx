import Image from 'next/image';
import Link from 'next/link';

import { catalogues } from '../../i18n';
import { useLocale } from '../layout/LocaleProvider';
import { PropertySearchBar } from '../search/PropertySearchBar';
import { ArrowIcon, PinIcon, ShieldIcon, SparkIcon } from '../ui/icons';

/**
 * The landing hero.
 *
 * One photograph, a veil that guarantees text contrast over any part of it,
 * and the search panel. The image is the page's largest paint, so it is
 * `priority` and sized per breakpoint; everything above it in the DOM is text.
 */
export function HeroSection() {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

  const highlights = [
    { icon: <ShieldIcon className="size-4" />, label: copy.trustOwner },
    { icon: <PinIcon className="size-4" />, label: copy.trustPrivacy },
    { icon: <SparkIcon className="size-4" />, label: copy.trustReview },
  ];

  return (
    <section
      className="editorial-hero relative isolate min-h-[38rem] bg-primary shadow-float md:min-h-[44rem]"
      data-testid="hero"
    >
      <Image
        alt=""
        className="editorial-hero__media object-cover"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1580px) 100vw, 1580px"
        src="/images/makaan-green-homes-hero.png"
      />
      <div
        aria-hidden="true"
        className="editorial-hero__veil absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="editorial-hero__light absolute inset-0"
      />

      <div className="relative flex min-h-[38rem] flex-col justify-between gap-10 p-5 text-white sm:p-8 md:min-h-[44rem] md:p-10 lg:p-14">
        <div className="hero-nav-in flex items-start justify-between gap-4 border-b border-white/25 pb-5 text-xs font-semibold sm:text-sm">
          <p className="max-w-56 leading-relaxed text-white/90">
            {copy.eyebrow}
          </p>
          <p className="text-end text-white/70">{copy.trustReview}</p>
        </div>

        <div className="space-y-8">
          <div className="hero-copy-in max-w-5xl">
            <h1 className="editorial-display text-[clamp(2.5rem,6vw,5.5rem)]">
              {copy.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              {copy.intro}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {highlights.map((highlight) => (
                <li
                  className="inline-flex items-center gap-2 rounded-pill border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm sm:text-sm"
                  key={highlight.label}
                >
                  <span aria-hidden="true">{highlight.icon}</span>
                  {highlight.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-search-in space-y-4">
            <PropertySearchBar />
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex min-h-tap items-center gap-2 rounded-pill border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white hover:text-ink"
                data-testid="hero-browse-link"
                href="/browse"
              >
                {copy.browseListings}
                <ArrowIcon className="flip-inline size-4" />
              </Link>
              <p className="text-xs text-white/70">{copy.heroScrollHint}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
