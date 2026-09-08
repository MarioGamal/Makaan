import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';

import type { PublicListingCard } from '@makaan/shared/types/marketplace';

import { CAIRO_CENTER, type BoundingBox } from '../../lib/geo';
import { formatCurrency, type Locale } from '../../i18n';
import { useTheme } from '../layout/ThemeProvider';
import { Button } from '../ui';
import { PinIcon } from '../ui/icons';

const Map = dynamic(
  async () => {
    const reactMapGl = await import('react-map-gl');
    return reactMapGl.default;
  },
  { ssr: false },
);

const Marker = dynamic(
  async () => {
    const reactMapGl = await import('react-map-gl');
    return reactMapGl.Marker;
  },
  { ssr: false },
);

type MapMoveEvent = {
  target?: {
    getBounds?: () => {
      getWest: () => number;
      getSouth: () => number;
      getEast: () => number;
      getNorth: () => number;
    };
  };
};

/** Public map boundary: only approved approximate locations become pins. */
export function SchematicMap({
  listings,
  selectedId,
  onSelect,
  labels,
  locale,
  onViewportChange,
  onSearchArea,
  mapMoved = false,
}: {
  listings: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
  locale: Locale;
  /** Fired on every frame of a pan or zoom; the caller throttles. */
  onViewportChange?: (box: BoundingBox) => void;
  onSearchArea?: () => void;
  mapMoved?: boolean;
}) {
  const { resolved } = useTheme();
  const pins = useMemo(
    () =>
      listings.filter(
        (listing) => listing.publicLocation.mode === 'approximate',
      ),
    [listings],
  );
  const hasMapbox =
    process.env.NEXT_PUBLIC_MAP_PROVIDER === 'mapbox' &&
    Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  const center = useMemo(() => {
    const points = pins.flatMap((listing) =>
      listing.publicLocation.mode === 'approximate'
        ? [
            {
              latitude: listing.publicLocation.latitude,
              longitude: listing.publicLocation.longitude,
            },
          ]
        : [],
    );
    if (points.length === 0) return CAIRO_CENTER;
    return {
      latitude:
        points.reduce((total, point) => total + point.latitude, 0) /
        points.length,
      longitude:
        points.reduce((total, point) => total + point.longitude, 0) /
        points.length,
    };
  }, [pins]);

  const onMove = useCallback(
    (event: MapMoveEvent) => {
      const bounds = event.target?.getBounds?.();
      if (!bounds || !onViewportChange) return;
      onViewportChange({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });
    },
    [onViewportChange],
  );

  const areaOnlyCount = listings.length - pins.length;
  const footnote =
    areaOnlyCount > 0
      ? `${areaOnlyCount} ${labels.areaOnly}`
      : labels.allPinned;

  return (
    <section
      aria-label={labels.map}
      className="relative overflow-hidden rounded-card border border-border bg-primary-soft shadow-ui"
      data-testid="local-map"
    >
      {hasMapbox ? (
        <div className="relative">
          <Map
            initialViewState={{ ...center, zoom: 10.5 }}
            mapStyle={
              resolved === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/light-v11'
            }
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            onMove={onMove}
            style={{ width: '100%', height: 520 }}
          >
            {pins.map((listing) => {
              if (listing.publicLocation.mode !== 'approximate') return null;
              const selected = selectedId === listing.id;
              return (
                <Marker
                  anchor="bottom"
                  key={listing.id}
                  latitude={listing.publicLocation.latitude}
                  longitude={listing.publicLocation.longitude}
                >
                  <button
                    aria-label={`${listing.title} — ${formatCurrency(listing.priceEgp, locale)}`}
                    aria-pressed={selected}
                    // Map pins are the one control kept under the 44px
                    // interface baseline: at that size the pills of a dense
                    // result set cover each other and the map underneath.
                    // 30px still clears the 24px WCAG 2.2 minimum.
                    className={`min-h-8 rounded-pill border px-2.5 py-1 text-xs font-semibold shadow-panel transition-transform duration-200 ease-spring hover:scale-105 ${
                      selected
                        ? 'border-transparent bg-ink text-on-ink'
                        : 'border-white/70 bg-primary text-white'
                    }`}
                    data-listing-id={listing.id}
                    data-testid="map-listing-marker"
                    onClick={() => onSelect(listing.id)}
                    type="button"
                  >
                    <span data-numeric>
                      {formatCurrency(listing.priceEgp, locale)}
                    </span>
                  </button>
                </Marker>
              );
            })}
          </Map>

          <p className="glass absolute inset-x-4 top-4 max-w-sm rounded-panel p-3 text-xs text-ink-muted shadow-ui">
            {labels.mapDescription}
          </p>

          {/*
           * Results only change when the visitor asks, so a pan never shifts
           * the list out from under the cursor.
           */}
          {mapMoved && onSearchArea ? (
            <div className="absolute inset-x-0 bottom-16 flex animate-fade-up justify-center">
              <Button
                data-testid="search-this-area"
                icon={<PinIcon className="size-4" />}
                onClick={onSearchArea}
              >
                {labels.searchThisArea}
              </Button>
            </div>
          ) : null}

          <p className="m-0 p-4 text-xs text-ink-muted">{footnote}</p>
        </div>
      ) : (
        <SchematicFallback
          footnote={footnote}
          labels={labels}
          locale={locale}
          onSelect={onSelect}
          pins={pins}
          selectedId={selectedId}
        />
      )}
    </section>
  );
}

/**
 * Shown when no map provider is configured, or when its tiles fail to load.
 * The pins stay usable, so discovery never depends on a third party.
 */
function SchematicFallback({
  pins,
  selectedId,
  onSelect,
  labels,
  locale,
  footnote,
}: {
  pins: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
  locale: Locale;
  footnote: string;
}) {
  return (
    <div className="relative min-h-[22rem]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(35deg, transparent 46%, rgb(var(--color-primary) / 0.16) 47%, rgb(var(--color-primary) / 0.16) 53%, transparent 54%), linear-gradient(-20deg, transparent 47%, rgb(var(--color-accent) / 0.2) 48%, rgb(var(--color-accent) / 0.2) 52%, transparent 53%)',
          backgroundSize: '120px 120px',
        }}
      />
      <div className="relative flex min-h-[22rem] flex-col justify-between gap-5 p-5">
        <div
          className="max-w-md"
          data-testid="map-fallback-status"
          role="status"
        >
          <p className="font-semibold text-ink">{labels.mapUnavailable}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {labels.mapUnavailableHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pins.map((listing) => (
            <button
              aria-label={`${listing.title} — ${formatCurrency(listing.priceEgp, locale)}`}
              aria-pressed={selectedId === listing.id}
              className={`inline-flex min-h-tap items-center gap-1.5 rounded-pill border px-3 text-xs font-semibold transition-colors ${
                selectedId === listing.id
                  ? 'border-transparent bg-primary text-white'
                  : 'border-border bg-surface-raised text-ink hover:border-primary'
              }`}
              data-listing-id={listing.id}
              data-testid="map-listing-marker"
              key={listing.id}
              onClick={() => onSelect(listing.id)}
              type="button"
            >
              <PinIcon className="size-3.5" />
              <span data-numeric>
                {formatCurrency(listing.priceEgp, locale)}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">{footnote}</p>
      </div>
    </div>
  );
}
