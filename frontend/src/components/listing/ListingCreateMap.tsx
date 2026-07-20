import dynamic from 'next/dynamic';

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

export function ListingCreateMap({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (location: { lat: number; lng: number }) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10">
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom: 11 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: '100%', height: 320 }}
      >
        <Marker
          draggable
          anchor="bottom"
          latitude={lat}
          longitude={lng}
          onDragEnd={(event) =>
            onChange({
              lat: event.lngLat.lat,
              lng: event.lngLat.lng,
            })
          }
        >
          <div className="h-5 w-5 rounded-full border-2 border-white bg-clay shadow-lg" />
        </Marker>
      </Map>
    </div>
  );
}

