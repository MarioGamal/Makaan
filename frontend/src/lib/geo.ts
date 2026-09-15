/**
 * Geographic helpers for map-driven search.
 *
 * The backend filters on a PostGIS envelope and rejects anything outside
 * Cairo, so every box leaving the browser is clamped to that extent first: a
 * map dragged past the city edge should narrow the search, not fail it.
 */

export type LatLng = { latitude: number; longitude: number };

/** west, south, east, north — the order the API expects. */
export type BoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/**
 * Mirrors the server-side Cairo extent. Kept in sync by
 * `PublicListingService.applyFilters`, which returns 400 for anything wider.
 */
export const CAIRO_BOUNDS: BoundingBox = {
  west: 30.7,
  south: 29.7,
  east: 32,
  north: 30.4,
};

export const CAIRO_CENTER: LatLng = { latitude: 30.0444, longitude: 31.2357 };

/** The server demands west < east and south < north strictly. */
const MIN_SPAN = 0.0008;
const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Six decimals is ~0.1 m: more only churns the cache key. */
export const roundCoordinate = (value: number, precision = 6) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export function clampToCairo(box: BoundingBox): BoundingBox {
  const west = clamp(box.west, CAIRO_BOUNDS.west, CAIRO_BOUNDS.east - MIN_SPAN);
  const south = clamp(
    box.south,
    CAIRO_BOUNDS.south,
    CAIRO_BOUNDS.north - MIN_SPAN,
  );
  return {
    west,
    south,
    east: clamp(box.east, west + MIN_SPAN, CAIRO_BOUNDS.east),
    north: clamp(box.north, south + MIN_SPAN, CAIRO_BOUNDS.north),
  };
}

export function isWithinCairo(point: LatLng): boolean {
  return (
    point.longitude >= CAIRO_BOUNDS.west &&
    point.longitude <= CAIRO_BOUNDS.east &&
    point.latitude >= CAIRO_BOUNDS.south &&
    point.latitude <= CAIRO_BOUNDS.north
  );
}

/**
 * A radius search becomes the smallest envelope containing the circle. The
 * public contract has no radius parameter, so the corners of that envelope are
 * culled client-side with `withinRadius` once the results arrive.
 */
export function boundingBoxFromRadius(
  center: LatLng,
  radiusKm: number,
): BoundingBox {
  const latitudeDelta = radiusKm / 111.32;
  const cosine = Math.cos(toRadians(center.latitude));
  // Guard the pole case even though Cairo is nowhere near it.
  const longitudeDelta = radiusKm / (111.32 * Math.max(cosine, 0.01));
  return clampToCairo({
    west: center.longitude - longitudeDelta,
    south: center.latitude - latitudeDelta,
    east: center.longitude + longitudeDelta,
    north: center.latitude + latitudeDelta,
  });
}

export function haversineKm(from: LatLng, to: LatLng): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function withinRadius(
  point: LatLng,
  center: LatLng,
  radiusKm: number,
): boolean {
  return haversineKm(center, point) <= radiusKm;
}

export function boundingBoxCenter(box: BoundingBox): LatLng {
  return {
    latitude: (box.south + box.north) / 2,
    longitude: (box.west + box.east) / 2,
  };
}

/** Diagonal half-length: the radius that covers the whole visible box. */
export function boundingBoxRadiusKm(box: BoundingBox): number {
  return (
    haversineKm(
      { latitude: box.south, longitude: box.west },
      { latitude: box.north, longitude: box.east },
    ) / 2
  );
}

export function formatBoundingBox(box: BoundingBox): string {
  const clamped = clampToCairo(box);
  return [clamped.west, clamped.south, clamped.east, clamped.north]
    .map((value) => roundCoordinate(value, 5))
    .join(',');
}

export function parseBoundingBox(
  value?: string | null,
): BoundingBox | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }
  const [west, south, east, north] = parts as [number, number, number, number];
  if (west >= east || south >= north) return undefined;
  return clampToCairo({ west, south, east, north });
}

/**
 * True when two boxes are close enough to share a result set.
 *
 * A map emits a move event for every animation frame of a drag. Without this
 * tolerance each frame would produce a new cache key and a new request; ~11 m
 * is far below the 100–500 m obfuscation applied to public locations, so it
 * cannot change which homes match.
 */
export function boundingBoxesEqual(
  a?: BoundingBox,
  b?: BoundingBox,
  tolerance = 0.0001,
): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.west - b.west) < tolerance &&
    Math.abs(a.south - b.south) < tolerance &&
    Math.abs(a.east - b.east) < tolerance &&
    Math.abs(a.north - b.north) < tolerance
  );
}
