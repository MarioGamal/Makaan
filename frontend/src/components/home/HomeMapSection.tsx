import {
  useEffect,
  useId,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { useListings } from '../../hooks/useListings';
import { catalogues, formatNumber } from '../../i18n';
import { useLocale } from '../layout/LocaleProvider';
import { SchematicMap } from '../map/SchematicMap';
import { Badge, Button, SegmentedControl } from '../ui';
import { CloseIcon, ExpandIcon, SparkIcon } from '../ui/icons';

export type MapCategory = 'all' | 'sale' | 'long_term_rent';

interface HomeMapSectionProps {
  category?: MapCategory;
  onCategoryChange?: (category: MapCategory) => void;
  onOpenMap?: (trigger: HTMLButtonElement) => void;
}

export function HomeMapSection({
  category: externalCategory,
  onCategoryChange,
  onOpenMap,
}: HomeMapSectionProps) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

  const [internalCategory, setInternalCategory] = useState<MapCategory>('all');
  const activeCategory = externalCategory ?? internalCategory;

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string>();
  const [modalResetTrigger, setModalResetTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);
  const mapDialogTitleId = useId();

  useEffect(() => setMounted(true), []);

  const labels = useMemo(
    () => ({
      ...copy,
      verified_owner: copy.verifiedOwner,
      owner_not_verified: copy.owner,
      declared_agent: copy.agent,
    }),
    [copy],
  );

  const queryParams = useMemo(
    () => ({
      locale,
      page: 1,
      pageSize: 40,
      sort: 'newest' as const,
      purpose: activeCategory === 'all' ? undefined : activeCategory,
    }),
    [activeCategory, locale],
  );

  const { listings } = useListings(queryParams, { keepPreviousData: false });

  const pinnedCount = useMemo(
    () =>
      listings.filter(
        (listing) => listing.publicLocation.mode === 'approximate',
      ).length,
    [listings],
  );

  const handleCategoryChange = (nextCategory: MapCategory) => {
    if (onCategoryChange) {
      onCategoryChange(nextCategory);
    } else {
      setInternalCategory(nextCategory);
    }
  };

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    if (onOpenMap) {
      onOpenMap(event.currentTarget);
    } else {
      setSelectedMapId(undefined);
      setModalResetTrigger((prev) => prev + 1);
      setInternalModalOpen(true);
    }
  };

  const closeInternalModal = () => {
    setInternalModalOpen(false);
    setSelectedMapId(undefined);
  };

  return (
    <section
      aria-labelledby="home-map-heading"
      className="mx-auto w-full max-w-content"
      data-testid="home-map-section"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            {copy.mapSectionEyebrow}
          </p>
          <h2
            className="mt-2 font-display text-3xl font-semibold md:text-4xl text-ink"
            id="home-map-heading"
          >
            {copy.mapSectionTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl<MapCategory>
            label={copy.purpose}
            onChange={handleCategoryChange}
            options={[
              {
                value: 'all',
                label: copy.allCategories,
                testId: 'home-map-category-all',
              },
              {
                value: 'sale',
                label: copy.buy,
                testId: 'home-map-category-sale',
              },
              {
                value: 'long_term_rent',
                label: copy.rent,
                testId: 'home-map-category-rent',
              },
            ]}
            size="sm"
            value={activeCategory}
          />

          <button
            aria-label={copy.showMap}
            className="inline-flex min-h-tap items-center gap-2 rounded-pill border border-border bg-surface-raised px-4 text-xs sm:text-sm font-semibold text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
            onClick={handleOpen}
            type="button"
          >
            <span>{copy.showMap}</span>
            <ExpandIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* Prototype Preview Card Container */}
      <div className="group relative mt-8 h-[360px] w-full overflow-hidden rounded-card border border-border bg-surface shadow-panel transition-all duration-300 hover:border-primary/60 hover:shadow-float sm:h-[460px]">
        {/* Prototype Header Badges */}
        <div className="pointer-events-none absolute top-4 start-4 z-10 flex items-center gap-2 rounded-pill border border-border/80 bg-surface-raised/95 dark:bg-surface/95 px-3.5 py-1.5 shadow-md backdrop-blur-md">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-ink">
            <span data-numeric>{formatNumber(pinnedCount, locale)}</span>{' '}
            {copy.pinnedLocations}
          </span>
        </div>

        <div className="pointer-events-none absolute top-4 end-4 z-10 hidden sm:flex items-center gap-1.5 rounded-pill border border-border/80 bg-surface-raised/90 dark:bg-surface/90 px-3 py-1 text-xs font-medium text-ink-muted shadow-sm backdrop-blur-sm">
          <SparkIcon className="size-3.5 text-primary" />
          <span>{locale === 'ar' ? 'نموذج تفاعلي' : 'Interactive Prototype'}</span>
        </div>

        {/* Live Mapbox Map rendered as non-blocking preview */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          inert
        >
          <SchematicMap
            className="h-full w-full rounded-none border-0 shadow-none"
            height="100%"
            hideControls
            key={`home-map-preview-${activeCategory}`}
            labels={labels}
            listings={listings}
            locale={locale}
            onReset={() => { }}
            onSelect={() => { }}
          />
        </div>

        {/* A single overlay button keeps the preview map out of the tab order. */}
        <button
          aria-label={copy.showMap}
          className="absolute inset-0 z-20 flex items-center justify-center bg-scrim/0 transition-all duration-300 hover:bg-scrim/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          onClick={handleOpen}
          type="button"
        >
          <span className="inline-flex items-center gap-2.5 rounded-pill border border-border/80 bg-surface-raised/95 px-5 py-3 text-sm font-semibold text-ink shadow-float backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:bg-primary group-hover:text-white dark:bg-surface/95">
            <ExpandIcon className="size-4" />
            <span>{copy.showMap}</span>
          </span>
        </button>
      </div>

      {/* Self-contained modal popup fallback if onOpenMap is not provided */}
      {mounted && !onOpenMap && internalModalOpen
        ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/55 p-3 backdrop-blur-sm animate-fade-in"
            onClick={closeInternalModal}
          >
            <div
              aria-labelledby={mapDialogTitleId}
              aria-modal="true"
              className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-card border border-border bg-surface shadow-float md:h-[85vh]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              tabIndex={-1}
            >
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-5 sm:py-2.5">
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

                <div className="flex flex-wrap items-center gap-2">
                  <SegmentedControl<MapCategory>
                    label={copy.purpose}
                    onChange={handleCategoryChange}
                    options={[
                      {
                        value: 'all',
                        label: copy.allCategories,
                        testId: 'internal-modal-category-all',
                      },
                      {
                        value: 'sale',
                        label: copy.buy,
                        testId: 'internal-modal-category-sale',
                      },
                      {
                        value: 'long_term_rent',
                        label: copy.rent,
                        testId: 'internal-modal-category-rent',
                      },
                    ]}
                    size="sm"
                    value={activeCategory}
                  />
                  <Button
                    onClick={() => {
                      setSelectedMapId(undefined);
                      setModalResetTrigger((prev) => prev + 1);
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    {copy.resetMap}
                  </Button>
                  <Button
                    aria-label={copy.closeMap}
                    icon={<CloseIcon className="size-[1.1rem]" />}
                    iconOnly
                    onClick={closeInternalModal}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>

              <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                <SchematicMap
                  className="h-full w-full rounded-none border-0 shadow-none"
                  height="100%"
                  key={`internal-modal-map-${activeCategory}`}
                  labels={labels}
                  listings={listings}
                  locale={locale}
                  onReset={() => setSelectedMapId(undefined)}
                  onSelect={setSelectedMapId}
                  resetTrigger={modalResetTrigger}
                  selectedId={selectedMapId}
                />
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </section>
  );
}
