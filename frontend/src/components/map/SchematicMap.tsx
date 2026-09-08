import type { PublicListingCard } from '@makaan/shared/types/marketplace';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import type { BoundingBox } from '../../lib/geo';
import { useTheme } from '../layout/ThemeProvider';

import {
  formatCurrency,
  formatNumber,
  propertyTypeLabel,
  type Locale,
} from '../../i18n';
import {
  fetchSavedListings,
  setListingSaved,
} from '../../services/saved.service';
import { Button, Card } from '../ui';

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

export function formatShortPrice(price: number, locale: Locale = 'ar') {
  if (locale === 'ar') {
    if (price >= 1_000_000) {
      const millions = price / 1_000_000;
      const formatted =
        millions >= 10 ? Math.round(millions) : Number(millions.toFixed(1));
      return `${formatNumber(formatted, locale)} مليون ج.م`;
    }
    if (price >= 1_000) {
      const thousands = Math.round(price / 1_000);
      return `${formatNumber(thousands, locale)} ألف ج.م`;
    }
    return `${formatNumber(price, locale)} ج.م`;
  }

  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const formatted =
      millions >= 10 ? Math.round(millions) : Number(millions.toFixed(1));
    return `${formatted}M EGP`;
  }
  if (price >= 1_000) {
    const thousands = Math.round(price / 1_000);
    return `${thousands}k EGP`;
  }
  return `${price} EGP`;
}

/** Public map boundary: only approved approximate locations become pins. */
export function SchematicMap({
  listings,
  selectedId,
  onSelect,
  labels,
  locale = 'ar',
  height = 500,
  className = '',
  hideControls = false,
  resetTrigger,
  onReset,
  onViewportChange,
  onSearchArea,
  mapMoved = false,
}: {
  listings: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
  locale?: Locale;
  height?: number | string;
  className?: string;
  hideControls?: boolean;
  resetTrigger?: number;
  onReset?: () => void;
  /** Fired on every frame of a pan or zoom; the caller throttles. */
  onViewportChange?: (box: BoundingBox) => void;
  /** Promotes the visible envelope into the search. */
  onSearchArea?: () => void;
  /** True while the map sits away from the searched area. */
  mapMoved?: boolean;
}) {
  const { resolved: resolvedTheme } = useTheme();

  const handleMove = (event: {
    target?: {
      getBounds?: () => {
        getWest: () => number;
        getSouth: () => number;
        getEast: () => number;
        getNorth: () => number;
      };
    };
  }) => {
    const bounds = event.target?.getBounds?.();
    if (!bounds || !onViewportChange) return;
    onViewportChange({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.resize === 'function'
    ) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current?.resize();
        } catch {
          // Ignore resize errors if unmounted
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [height]);

  const pins = listings.filter(
    (listing) => listing.publicLocation.mode === 'approximate',
  );

  const coordinates = pins.flatMap((listing) =>
    listing.publicLocation.mode === 'approximate'
      ? [
          {
            latitude: listing.publicLocation.latitude,
            longitude: listing.publicLocation.longitude,
          },
        ]
      : [],
  );

  const latitude = coordinates.length
    ? coordinates.reduce((total, point) => total + point.latitude, 0) /
      coordinates.length
    : 30.0444;
  const longitude = coordinates.length
    ? coordinates.reduce((total, point) => total + point.longitude, 0) /
      coordinates.length
    : 31.2357;

  const handleResetView = () => {
    onSelect('');
    if (
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.flyTo === 'function'
    ) {
      try {
        mapInstanceRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 10.5,
          pitch: 0,
          bearing: 0,
          offset: [0, 0],
          duration: 550,
          essential: true,
        });
      } catch {
        // ignore
      }
    }
    onReset?.();
  };

  const handleZoomIn = () => {
    if (
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.zoomIn === 'function'
    ) {
      try {
        mapInstanceRef.current.zoomIn({ duration: 300 });
      } catch {
        // ignore
      }
    }
  };

  const handleZoomOut = () => {
    if (
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.zoomOut === 'function'
    ) {
      try {
        mapInstanceRef.current.zoomOut({ duration: 300 });
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger]);

  const prevSelectedIdRef = useRef<string | undefined>(selectedId);
  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedIdRef.current) {
      const target = pins.find((p) => p.id === selectedId);
      if (
        target &&
        target.publicLocation.mode === 'approximate' &&
        mapInstanceRef.current &&
        typeof mapInstanceRef.current.flyTo === 'function'
      ) {
        const isSmallScreen =
          typeof window !== 'undefined' && window.innerWidth < 640;
        try {
          mapInstanceRef.current.flyTo({
            center: [
              target.publicLocation.longitude,
              target.publicLocation.latitude,
            ],
            zoom: Math.max(mapInstanceRef.current.getZoom?.() || 10.5, 12),
            offset: [0, isSmallScreen ? -70 : -45],
            duration: 650,
            essential: true,
          });
        } catch {
          // ignore
        }
      }
    } else if (
      !selectedId &&
      prevSelectedIdRef.current &&
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.flyTo === 'function'
    ) {
      try {
        mapInstanceRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 10.5,
          pitch: 0,
          bearing: 0,
          offset: [0, 0],
          duration: 550,
          essential: true,
        });
      } catch {
        // ignore
      }
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId, pins, latitude, longitude]);

  const handleSelectPin = (listing: PublicListingCard) => {
    onSelect(listing.id);
    if (
      listing.publicLocation.mode === 'approximate' &&
      mapInstanceRef.current &&
      typeof mapInstanceRef.current.flyTo === 'function'
    ) {
      const isSmallScreen =
        typeof window !== 'undefined' && window.innerWidth < 640;
      try {
        mapInstanceRef.current.flyTo({
          center: [
            listing.publicLocation.longitude,
            listing.publicLocation.latitude,
          ],
          zoom: Math.max(mapInstanceRef.current.getZoom?.() || 10.5, 12),
          offset: [0, isSmallScreen ? -70 : -45],
          duration: 650,
          essential: true,
        });
      } catch {
        // ignore
      }
    }
  };

  const hasMapbox =
    process.env.NEXT_PUBLIC_MAPPROVIDER === 'mapbox' ||
    process.env.NEXT_PUBLIC_MAP_PROVIDER === 'mapbox';

  const selectedListing = selectedId
    ? listings.find((l) => l.id === selectedId)
    : undefined;

  const isFullHeight = height === '100%';

  return (
    <Card
      aria-label={labels.map}
      data-testid="local-map"
      className={`relative overflow-hidden rounded-[2rem] border border-border/80 bg-surface-raised shadow-panel ${
        isFullHeight
          ? 'flex h-full w-full flex-1 min-h-0 min-w-0 rounded-none border-0 shadow-none'
          : ''
      } ${className}`}
      padding="none"
    >
      {hasMapbox ? (
        <div
          className={`relative w-full overflow-hidden ${
            isFullHeight ? 'h-full flex-1 min-h-0 min-w-0' : ''
          }`}
          style={isFullHeight ? { height: '100%' } : { height }}
        >
          {/* Absolutely Positioned Map Frame - Cannot Expand Parent */}
          <div className="absolute inset-0 h-full w-full overflow-hidden">
            <Map
              initialViewState={{ latitude, longitude, zoom: 10.5 }}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
              mapStyle={
                resolvedTheme === 'dark'
                  ? 'mapbox://styles/mapbox/dark-v11'
                  : 'mapbox://styles/mapbox/streets-v12'
              }
              onMove={handleMove}
              onClick={() => onSelect('')}
              onLoad={(evt) => {
                mapInstanceRef.current = evt.target;
                setTimeout(() => {
                  try {
                    evt.target?.resize();
                  } catch {
                    // ignore
                  }
                }, 100);
              }}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Pins */}
              {pins.map((listing, index) => {
                if (listing.publicLocation.mode !== 'approximate') return null;
                const isSelected = selectedId === listing.id;
                const markerLabel = `${labels.pin || (locale === 'ar' ? 'عقار' : 'Listing')} ${index + 1}: ${listing.title}`;

                return (
                  <Marker
                    anchor="bottom"
                    key={listing.id}
                    latitude={listing.publicLocation.latitude}
                    longitude={listing.publicLocation.longitude}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Active Radiant Pulse Rings when pin is selected */}
                      {isSelected && (
                        <>
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-2.5 rounded-full bg-primary/35 animate-ping"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -inset-1.5 rounded-full bg-primary/20 animate-pulse"
                          />
                        </>
                      )}

                      <button
                        aria-label={markerLabel}
                        aria-pressed={isSelected}
                        data-listing-id={listing.id}
                        data-testid="map-listing-marker"
                        className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 transform ${
                          isSelected
                            ? 'scale-110 sm:scale-125 bg-primary text-white shadow-[0_10px_25px_rgba(18,92,78,0.5),0_2px_8px_rgba(0,0,0,0.15)] ring-[2.5px] ring-white ring-offset-2 ring-offset-primary z-40'
                            : 'bg-surface-raised text-ink shadow-md border border-border/80 hover:scale-105 hover:bg-primary hover:text-white hover:border-primary z-10'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPin(listing);
                        }}
                        title={markerLabel}
                        type="button"
                      >
                        {/* Status Dot */}
                        <span
                          className={`h-2 w-2 rounded-full transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-white shadow-sm ring-1 ring-white/60'
                              : listing.participation === 'verified_owner'
                                ? 'bg-success'
                                : listing.participation === 'declared_agent'
                                  ? 'bg-warning'
                                  : 'bg-primary'
                          }`}
                        />

                        <span className="font-sans font-bold tracking-tight">
                          {formatShortPrice(listing.priceEgp, locale)}
                        </span>

                        {/* Bottom arrow tip */}
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rotate-45 transition-colors ${
                            isSelected
                              ? 'bg-primary'
                              : 'bg-surface-raised group-hover:bg-primary border-b border-r border-border/80 group-hover:border-primary'
                          }`}
                        />
                      </button>
                    </div>
                  </Marker>
                );
              })}
            </Map>

            {/* On-Map Floating Navigation & Reset Controls */}
            {!hideControls && (
              <div className="absolute top-3 end-3 z-20 flex flex-col items-center gap-1 rounded-2xl glass border border-border/80 p-1 shadow-panel">
                <button
                  aria-label={locale === 'ar' ? 'تكبير الخريطة' : 'Zoom in'}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface-muted active:scale-95 focus-visible:outline-none"
                  onClick={handleZoomIn}
                  title={locale === 'ar' ? 'تكبير' : 'Zoom in'}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 4.5v15m7.5-7.5h-15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  aria-label={locale === 'ar' ? 'تصغير الخريطة' : 'Zoom out'}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface-muted active:scale-95 focus-visible:outline-none"
                  onClick={handleZoomOut}
                  title={locale === 'ar' ? 'تصغير' : 'Zoom out'}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="my-0.5 h-px w-5 bg-border/80" />

                <button
                  aria-label={
                    locale === 'ar' ? 'إعادة ضبط الخريطة' : 'Reset map view'
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-ink transition-colors hover:bg-primary hover:text-white active:scale-95 focus-visible:outline-none"
                  onClick={handleResetView}
                  title={
                    locale === 'ar' ? 'إعادة ضبط الخريطة' : 'Reset map view'
                  }
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/*
            Results follow the map only when the visitor asks, so panning never
            shifts the list out from under the cursor.
          */}
          {mapMoved && onSearchArea ? (
            <div className="absolute inset-x-0 top-3 z-30 flex justify-center">
              <Button
                className="animate-map-card-in shadow-panel"
                data-testid="search-this-area"
                onClick={onSearchArea}
                size="sm"
              >
                {labels.searchThisArea}
              </Button>
            </div>
          ) : null}

          {/* Floating Bottom Overlay: Selected Listing Preview Card or Privacy Note */}
          {selectedListing ? (
            <div className="absolute bottom-3 inset-x-3 sm:bottom-5 sm:start-5 sm:end-auto sm:w-[450px] max-w-[calc(100%-24px)] z-30 drop-shadow-2xl">
              <MapListingPreviewCard
                labels={labels}
                listing={selectedListing}
                locale={locale}
                onClose={() => onSelect('')}
              />
            </div>
          ) : (
            <div className="pointer-events-none absolute bottom-4 start-4 z-10 max-w-sm rounded-2xl border border-border bg-white px-3.5 py-2 text-xs text-ink-muted shadow-md">
              <div className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{labels.mapDescription}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <SchematicFallback
          labels={labels}
          listings={listings}
          onSelect={onSelect}
          pins={pins}
          selectedId={selectedId}
        />
      )}
    </Card>
  );
}

function MapListingPreviewCard({
  listing,
  locale,
  labels,
  onClose,
}: {
  listing: PublicListingCard;
  locale: Locale;
  labels: Record<string, string>;
  onClose: () => void;
}) {
  const router = useRouter();
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  const [imageBroken, setImageBroken] = useState(false);
  const [isSaved, setIsSaved] = useState(listing.saved ?? false);
  const [saving, setSaving] = useState(false);
  const [savePopping, setSavePopping] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSavedListings()
      .then((items) => {
        if (active) {
          setIsSaved(items.some((item) => item.id === listing.id));
        }
      })
      .catch(() => {
        // Silently preserve initial listing.saved
      });
    return () => {
      active = false;
    };
  }, [listing.id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setSavePopping(true);
    setTimeout(() => setSavePopping(false), 350);
    setSaving(true);
    try {
      const res = await setListingSaved(listing.id, nextSaved);
      setIsSaved(res.saved);
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setSaving(false);
    }
  };

  const isVerified = listing.participation === 'verified_owner';
  const isAgent = listing.participation === 'declared_agent';
  const participationText = isVerified
    ? labels.verifiedOwner ||
      labels.verified_owner ||
      (locale === 'ar' ? 'مالك موثق' : 'Verified Owner')
    : isAgent
      ? labels.agent ||
        labels.declared_agent ||
        (locale === 'ar' ? 'وكيل معلن' : 'Declared Agent')
      : labels.owner ||
        labels.owner_not_verified ||
        (locale === 'ar' ? 'مالك' : 'Owner');

  const handleCardClick = () => {
    void router.push(`/listings/${listing.id}`);
  };

  return (
    <div
      className="group relative flex flex-row items-stretch overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-white shadow-[0_16px_40px_rgba(25,42,37,0.18),0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(25,42,37,0.24),0_6px_16px_rgba(0,0,0,0.1)] cursor-pointer animate-map-card-in select-none"
      onClick={handleCardClick}
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Top Accent Gradient Bar for Verified Listings */}
      {isVerified && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success via-primary to-success z-20"
        />
      )}

      {/* Dismiss / Close Button */}
      <button
        aria-label={labels.close || (locale === 'ar' ? 'إغلاق' : 'Close')}
        className="absolute end-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink-muted border border-border/80 shadow-sm transition-all duration-200 hover:bg-danger hover:text-white hover:border-danger hover:scale-110 active:scale-90 focus-visible:outline-none"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title={labels.close || (locale === 'ar' ? 'إغلاق' : 'Close')}
        type="button"
      >
        <svg
          className="h-3 w-3 stroke-[2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Thumbnail Container with Badges and Wishlist */}
      <div className="relative w-32 sm:w-44 shrink-0 overflow-hidden bg-[#eee8dc] m-2 sm:m-2.5 rounded-xl sm:rounded-2xl">
        {listing.coverImage && !imageBroken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={listing.coverImage.alt || listing.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageBroken(true)}
            src={listing.coverImage.url}
          />
        ) : (
          <div className="flex h-full min-h-[110px] flex-col items-center justify-center p-2 text-center text-xs text-ink-muted bg-[#eee8dc]">
            <svg
              className="h-7 w-7 text-ink-muted/50 mb-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] font-medium leading-tight text-ink-muted">
              {labels.noImage ||
                (locale === 'ar' ? 'لا توجد صورة' : 'No image')}
            </span>
          </div>
        )}

        {/* Soft Vignette Overlay for Badges Readability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"
        />

        {/* Wishlist / Save Heart Button (Pure icon, no background) */}
        <button
          aria-label={
            isSaved
              ? labels.unsave ||
                (locale === 'ar' ? 'شيله من المحفوظات' : 'Remove from saved')
              : labels.save || (locale === 'ar' ? 'احفظه' : 'Save home')
          }
          className={`absolute start-2 top-2 z-20 flex items-center justify-center p-1 bg-transparent transition-transform duration-200 hover:scale-110 active:scale-90 focus:outline-none ${
            savePopping ? 'animate-heart-pop' : ''
          }`}
          onClick={handleToggleSave}
          title={
            isSaved
              ? labels.unsave ||
                (locale === 'ar' ? 'شيله من المحفوظات' : 'Remove from saved')
              : labels.save || (locale === 'ar' ? 'احفظه' : 'Save home')
          }
          type="button"
        >
          <svg
            className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200 ${
              isSaved
                ? 'fill-danger stroke-danger drop-shadow-[0_2px_6px_rgba(174,62,50,0.6)]'
                : 'fill-black/25 stroke-white stroke-[2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] hover:fill-danger/40 hover:stroke-white'
            }`}
            viewBox="0 0 24 24"
          >
            <path
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Purpose Pill (Sale / Rent) */}
        <div className="absolute end-2 top-2 z-10">
          <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-ink shadow-md border border-border/60">
            {listing.purpose === 'sale'
              ? labels.sale || (locale === 'ar' ? 'للبيع' : 'Sale')
              : labels.rent || (locale === 'ar' ? 'للإيجار' : 'Rent')}
          </span>
        </div>

        {/* Bottom Badge: Verified Owner or Agent */}
        <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shadow-md">
              <svg
                className="h-2.5 w-2.5 shrink-0 fill-current"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  fillRule="evenodd"
                />
              </svg>
              <span className="truncate">{participationText}</span>
            </span>
          ) : isAgent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning text-white px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shadow-md">
              <span className="truncate">{participationText}</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-black/60 text-white px-2 py-0.5 text-[9px] font-medium shadow-md">
              <span className="truncate">{participationText}</span>
            </span>
          )}
        </div>
      </div>

      {/* Content & Specs Column */}
      <div className="flex flex-1 flex-col justify-between py-2.5 pe-9 ps-1 sm:py-3 sm:pe-10 sm:ps-1.5 min-w-0 bg-white">
        {/* Top: Price & Title */}
        <div>
          {/* Price with High-Contrast Typography */}
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-primary leading-none">
              {formatCurrency(listing.priceEgp, locale)}
            </span>
            {listing.purpose === 'long_term_rent' && (
              <span className="text-[11px] font-semibold text-ink-muted">
                {locale === 'ar' ? '/ شهر' : '/ mo'}
              </span>
            )}
          </div>

          {/* Title with hover color highlight */}
          <h3 className="mt-1 line-clamp-1 text-xs sm:text-sm font-bold text-ink leading-snug group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Area Location with Mini Map Pin */}
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-ink-muted line-clamp-1">
            <svg
              className="h-3 w-3 shrink-0 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="truncate">{area}</span>
            <span className="text-border">·</span>
            <span className="truncate">
              {propertyTypeLabel(locale, listing.propertyType)}
            </span>
          </p>
        </div>

        {/* Specs Ribbon with Crisp SVGs */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-ink">
          {/* Area Size */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#eee8dc] px-1.5 py-0.5 text-ink">
            <svg
              className="h-3 w-3 shrink-0 text-ink-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{formatNumber(listing.sizeSqm, locale)} م²</span>
          </span>

          {/* Bedrooms */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#eee8dc] px-1.5 py-0.5 text-ink">
            <svg
              className="h-3 w-3 shrink-0 text-ink-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                d="M3 7v11m0-4h18m0-7v11M3 11h18M7 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {formatNumber(listing.bedrooms, locale)}{' '}
              {locale === 'ar' ? 'غرف' : 'beds'}
            </span>
          </span>

          {/* Bathrooms */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#eee8dc] px-1.5 py-0.5 text-ink">
            <svg
              className="h-3 w-3 shrink-0 text-ink-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1zm2-4a2 2 0 012-2h1a2 2 0 012 2v4H6V8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {formatNumber(listing.bathrooms, locale)}{' '}
              {locale === 'ar' ? 'حمام' : 'baths'}
            </span>
          </span>
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
          {/* Privacy Note */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-ink-muted truncate">
            <svg
              className="h-3 w-3 shrink-0 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="truncate">
              {labels.approximate ||
                (locale === 'ar' ? 'موقع تقريبي' : 'Approximate')}
            </span>
          </div>

          {/* Primary View Details Button */}
          <Link
            className="ms-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-primary-strong active:scale-95 group-hover:bg-primary-strong"
            href={`/listings/${listing.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span>
              {labels.details || (locale === 'ar' ? 'عرض التفاصيل' : 'Details')}
            </span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 rtl:rotate-180 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SchematicFallback({
  listings,
  pins,
  selectedId,
  onSelect,
  labels,
}: {
  listings: PublicListingCard[];
  pins: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(35deg, transparent 46%, rgb(var(--color-primary) / 0.16) 47%, rgb(var(--color-primary) / 0.16) 53%, transparent 54%), linear-gradient(-20deg, transparent 47%, rgb(var(--color-accent) / 0.2) 48%, rgb(var(--color-accent) / 0.2) 52%, transparent 53%)',
          backgroundSize: '120px 120px',
        }}
      />
      <div className="relative flex h-full min-h-[22rem] flex-col justify-between gap-5 p-5">
        <div className="max-w-md" data-testid="map-fallback-status" role="status">
          <p className="font-semibold text-ink">{labels.mapUnavailable}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {labels.mapUnavailableHint}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pins.map((listing, index) => (
            <Button
              aria-pressed={selectedId === listing.id}
              className="justify-start"
              key={listing.id}
              onClick={() => onSelect(listing.id)}
              size="sm"
              variant={selectedId === listing.id ? 'primary' : 'secondary'}
            >
              {labels.pin} {index + 1}
            </Button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          {listings.length - pins.length > 0
            ? `${listings.length - pins.length} ${labels.areaOnly}`
            : labels.allPinned}
        </p>
      </div>
    </>
  );
}
