import Image from 'next/image';

import { catalogues } from '../../i18n';
import { useLocale } from '../layout/LocaleProvider';
import { PropertySearchBar } from '../search/PropertySearchBar';

/**
 * The landing hero.
 * Clean, simple, and uncluttered with the featured Cairo homes photograph,
 * high-contrast typography, and floating search bar.
 */
export function HeroSection() {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

  return (
    <section
      className="relative isolate overflow-hidden rounded-hero border border-border/60 shadow-float min-h-[32rem] sm:min-h-[36rem] md:min-h-[40rem] flex flex-col justify-center items-center px-4 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20 text-center"
      data-testid="hero"
    >
      {/* Cairo green homes background photograph */}
      <Image
        alt=""
        className="pointer-events-none object-cover object-center select-none"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1580px) 100vw, 1580px"
        src="/images/makaan-green-homes-hero.png"
      />

      {/* Modern gradient overlay for crisp legibility while preserving photo vibrancy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35"
      />

      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        {/* Crisp, modern headline */}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] drop-shadow-sm">
          {copy.headline}
        </h1>

        {/* Clear, focused subtitle */}
        <p className="mx-auto mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-white/90 leading-relaxed drop-shadow-sm">
          {copy.intro}
        </p>

        {/* Search Panel */}
        <div className="mt-8 sm:mt-10 text-start">
          <PropertySearchBar variant="glass" />
        </div>
      </div>
    </section>
  );
}
