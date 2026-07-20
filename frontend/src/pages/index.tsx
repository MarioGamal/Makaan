import { useEffect, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';
import type { ViewState } from 'react-map-gl';

import { FilterPanel, type ListingFilters } from '../components/filters/FilterPanel';
import { MapLayout } from '../components/layout/MapLayout';
import { EmptyState } from '../components/map/EmptyState';
import { ListingPinsLayer } from '../components/map/ListingPin';
import { AreaSearchBar } from '../components/search/AreaSearchBar';
import { useListings } from '../hooks/useListings';
import type { ListingCard } from '../services/listings.service';

const Map = dynamic(
  async () => {
    const reactMapGl = await import('react-map-gl');
    return reactMapGl.default;
  },
  { ssr: false },
);

const cairoView: ViewState = {
  latitude: 30.0444,
  longitude: 31.2357,
  zoom: 11,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
};

// pitch is locked to 0 via maxPitch on the Map component to avoid
// a mapbox-gl bug in pointRayIntersection during mouseover events

const cairoBounds: [number, number, number, number] = [28.9, 29.5, 32.5, 31.5];

const toBboxArray = (
  bounds: [[number, number], [number, number]] | null,
): [number, number, number, number] | undefined => {
  if (!bounds) {
    return undefined;
  }

  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return [minLng, minLat, maxLng, maxLat];
};

const isWithinCairo = (longitude: number, latitude: number) =>
  longitude >= cairoBounds[0] &&
  longitude <= cairoBounds[2] &&
  latitude >= cairoBounds[1] &&
  latitude <= cairoBounds[3];

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>(cairoView);
  const [selectedListing, setSelectedListing] = useState<ListingCard | null>(null);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [bbox, setBbox] = useState<[number, number, number, number] | undefined>(undefined);
  const [outsideCairo, setOutsideCairo] = useState(false);

  const params = useMemo(
    () => ({
      bbox: bbox?.join(','),
      ...filters,
      page: 1,
      limit: 50,
    }),
    [bbox, filters],
  );
  const { listings, isLoading } = useListings(params);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
  const activeListings = useMemo(() => listings.slice(0, 50), [listings]);

  useEffect(() => {
    if (!selectedListing) {
      return;
    }

    const nextSelected = activeListings.find((listing) => listing.id === selectedListing.id);
    setSelectedListing(nextSelected ?? null);
  }, [activeListings, selectedListing]);

  const handleMoveEnd = (nextViewState: ViewState, nextBounds?: [[number, number], [number, number]]) => {
    setViewState(nextViewState);
    setBbox(toBboxArray(nextBounds ?? null));
    setFilters((current) => {
      if (!current.area_id) {
        return current;
      }

      const { area_id: _areaId, ...rest } = current;
      return rest;
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setViewState(cairoView);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!isWithinCairo(longitude, latitude)) {
          setOutsideCairo(true);
          setViewState(cairoView);
          return;
        }

        setOutsideCairo(false);
        setViewState({
          ...cairoView,
          latitude,
          longitude,
          zoom: 13,
        });
      },
      () => {
        setViewState(cairoView);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  return (
    <MapLayout
      filters={
        <FilterPanel
          filters={filters}
          onChange={(nextFilters) => {
            setOutsideCairo(false);
            setFilters(nextFilters);
          }}
          onClear={() => {
            setOutsideCairo(false);
            setFilters({});
          }}
        />
      }
      listings={activeListings}
      map={
        <>
          {(outsideCairo || (!isLoading && activeListings.length === 0)) && (
            <EmptyState
              onClear={() => {
                setOutsideCairo(false);
                setFilters({});
                setViewState(cairoView);
              }}
              variant={outsideCairo ? 'outside-cairo' : 'filters'}
            />
          )}
          <Map
            initialViewState={cairoView}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={mapboxToken}
            maxPitch={0}
            onMove={(event) => setViewState(event.viewState)}
            onMoveEnd={(event) => {
              const bounds = event.target.getBounds();
              handleMoveEnd(
                event.viewState,
                bounds ? (bounds.toArray() as [[number, number], [number, number]]) : undefined,
              );
            }}
            reuseMaps
            style={{ width: '100%', height: '100%' }}
            {...viewState}
          >
            <ListingPinsLayer
              bbox={bbox}
              listings={activeListings}
              onClose={() => setSelectedListing(null)}
              onClusterSelect={(coordinates, zoom) =>
                setViewState((current) => ({
                  ...current,
                  longitude: coordinates[0],
                  latitude: coordinates[1],
                  zoom,
                }))
              }
              onSelect={(listing) => setSelectedListing(listing)}
              selectedListing={selectedListing}
              zoom={viewState.zoom}
            />
          </Map>
        </>
      }
      toolbar={
        <>
          <AreaSearchBar
            onSelect={(area) => {
              setOutsideCairo(false);
              setFilters((current) => ({ ...current, area_id: area.id }));
              setViewState({
                ...cairoView,
                latitude: (area.bbox[1] + area.bbox[3]) / 2,
                longitude: (area.bbox[0] + area.bbox[2]) / 2,
                zoom: 12,
              });
              setBbox(area.bbox);
            }}
          />
          <div className="flex gap-3">
            <button
              className="rounded-full border border-ink/10 bg-white/85 px-4 py-3 text-sm shadow-sm"
              onClick={handleLocateMe}
              type="button"
            >
              Find listings near me
            </button>
            <div className="rounded-full bg-white/85 px-4 py-3 text-sm shadow-sm">
              {isLoading ? 'Loading listings...' : `${activeListings.length} listings`}
            </div>
          </div>
        </>
      }
    />
  );
}
