import { useMemo } from 'react';

import Supercluster from 'supercluster';
import { Marker, Popup } from 'react-map-gl';

import type { ListingCard } from '../../services/listings.service';
import { ListingPopup } from './ListingPopup';

const formatCompactPrice = (price: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(price);

type ClusterFeature = {
  type: 'Feature';
  properties: {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

type PointFeature = {
  type: 'Feature';
  properties: {
    cluster?: false;
    listing: ListingCard;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
};

function isClusterFeature(feature: ClusterFeature | PointFeature): feature is ClusterFeature {
  return Boolean((feature as ClusterFeature).properties.cluster);
}

export function ListingPin({
  listing,
  isSelected,
  onSelect,
  onClose,
}: {
  listing: ListingCard;
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <Marker
        anchor="bottom"
        latitude={listing.location.lat}
        longitude={listing.location.lng}
      >
        <button
          className="rounded-full border border-white/70 bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
          onClick={onSelect}
          type="button"
        >
          {formatCompactPrice(listing.priceEgp)}
          {listing.seller.isVerified ? ' - Verified' : ''}
        </button>
      </Marker>
      {isSelected ? (
        <Popup
          anchor="top"
          closeButton
          closeOnClick={false}
          latitude={listing.location.lat}
          longitude={listing.location.lng}
          onClose={onClose}
          offset={20}
        >
          <ListingPopup listing={listing} />
        </Popup>
      ) : null}
    </>
  );
}

export function ListingPinsLayer({
  listings,
  selectedListing,
  bbox,
  zoom,
  onSelect,
  onClose,
  onClusterSelect,
}: {
  listings: ListingCard[];
  selectedListing: ListingCard | null;
  bbox?: [number, number, number, number];
  zoom: number;
  onSelect: (listing: ListingCard) => void;
  onClose: () => void;
  onClusterSelect: (coordinates: [number, number], zoom: number) => void;
}) {
  const points = useMemo<PointFeature[]>(
    () =>
      listings.map((listing) => ({
        type: 'Feature',
        properties: { listing },
        geometry: {
          type: 'Point',
          coordinates: [listing.location.lng, listing.location.lat],
        },
      })),
    [listings],
  );

  const clusterer = useMemo(() => {
    const instance = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });
    instance.load(points);
    return instance;
  }, [points]);

  const clusters = useMemo(() => {
    if (!bbox) {
      return points;
    }

    return clusterer.getClusters(bbox, Math.round(zoom)) as Array<
      ClusterFeature | PointFeature
    >;
  }, [bbox, clusterer, points, zoom]);

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;

        if (isClusterFeature(feature)) {
          return (
            <Marker anchor="center" key={`cluster-${feature.properties.cluster_id}`} latitude={lat} longitude={lng}>
              <button
                className="flex h-12 w-12 items-center justify-center rounded-full bg-clay text-sm font-semibold text-white shadow-lg"
                onClick={() => {
                  const expansionZoom = Math.min(
                    clusterer.getClusterExpansionZoom(feature.properties.cluster_id),
                    16,
                  );
                  onClusterSelect([lng, lat], expansionZoom);
                }}
                type="button"
              >
                {feature.properties.point_count_abbreviated}
              </button>
            </Marker>
          );
        }

        return (
          <ListingPin
            isSelected={selectedListing?.id === feature.properties.listing.id}
            key={feature.properties.listing.id}
            listing={feature.properties.listing}
            onClose={onClose}
            onSelect={() => onSelect(feature.properties.listing)}
          />
        );
      })}
    </>
  );
}
