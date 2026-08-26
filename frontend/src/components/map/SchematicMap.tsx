import type { PublicListingCard } from '@makaan/shared/types/marketplace';
import dynamic from 'next/dynamic';

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

/** Public map boundary: only approved approximate locations become pins. */
export function SchematicMap({
  listings,
  selectedId,
  onSelect,
  labels,
}: {
  listings: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
}) {
  const pins = listings.filter(
    (listing) => listing.publicLocation.mode === 'approximate',
  );
  const hasMapbox =
    process.env.NEXT_PUBLIC_MAP_PROVIDER === 'mapbox' &&
    Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
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

  return (
    <Card
      aria-label={labels.map}
      className="relative min-h-[22rem] overflow-hidden bg-primary-soft p-0"
    >
      {hasMapbox ? (
        <div className="relative">
          <Map
            initialViewState={{ latitude, longitude, zoom: 10.5 }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            style={{ width: '100%', height: 440 }}
          >
            {pins.map((listing, index) => {
              if (listing.publicLocation.mode !== 'approximate') return null;
              const markerLabel = `${labels.pin} ${index + 1}: ${listing.title}`;
              return (
                <Marker
                  anchor="bottom"
                  key={listing.id}
                  latitude={listing.publicLocation.latitude}
                  longitude={listing.publicLocation.longitude}
                >
                  <button
                    aria-label={markerLabel}
                    aria-pressed={selectedId === listing.id}
                    className={`h-8 w-8 rounded-full border-2 border-white shadow-lg transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      selectedId === listing.id ? 'bg-ink' : 'bg-clay'
                    }`}
                    onClick={() => onSelect(listing.id)}
                    title={markerLabel}
                    type="button"
                  />
                </Marker>
              );
            })}
          </Map>
          <div className="absolute inset-x-4 top-4 max-w-sm rounded-2xl bg-canvas/90 p-3 text-sm text-ink-muted shadow-sm backdrop-blur">
            {labels.mapDescription}
          </div>
          <p className="m-0 p-4 text-xs text-ink-muted">
            {listings.length - pins.length > 0
              ? `${listings.length - pins.length} ${labels.areaOnly}`
              : labels.allPinned}
          </p>
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
            'linear-gradient(35deg, transparent 46%, #125c4e22 47%, #125c4e22 53%, transparent 54%), linear-gradient(-20deg, transparent 47%, #b8643b33 48%, #b8643b33 52%, transparent 53%)',
          backgroundSize: '120px 120px',
        }}
      />
      <div className="relative flex h-full min-h-[22rem] flex-col justify-between p-5">
        <p className="max-w-sm text-sm text-ink-muted">
          {labels.mapDescription}
        </p>
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
