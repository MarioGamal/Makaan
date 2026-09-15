import { describe, expect, it } from 'vitest';

import {
  boundingBoxesEqual,
  boundingBoxFromRadius,
  CAIRO_BOUNDS,
  CAIRO_CENTER,
  clampToCairo,
  formatBoundingBox,
  haversineKm,
  parseBoundingBox,
  withinRadius,
} from './geo';

describe('clampToCairo', () => {
  it('keeps a box that is already inside the governed extent', () => {
    const box = { west: 31.1, south: 30, east: 31.3, north: 30.1 };
    expect(clampToCairo(box)).toEqual(box);
  });

  it('pulls a box dragged past the city edge back to the extent', () => {
    const clamped = clampToCairo({
      west: 25,
      south: 20,
      east: 40,
      north: 45,
    });
    expect(clamped).toEqual(CAIRO_BOUNDS);
  });

  it('never produces a degenerate box, which the API rejects', () => {
    // A map zoomed far outside Cairo collapses to a sliver at the boundary.
    const clamped = clampToCairo({
      west: 45,
      south: 40,
      east: 46,
      north: 41,
    });
    expect(clamped.west).toBeLessThan(clamped.east);
    expect(clamped.south).toBeLessThan(clamped.north);
    expect(clamped.east).toBeLessThanOrEqual(CAIRO_BOUNDS.east);
    expect(clamped.north).toBeLessThanOrEqual(CAIRO_BOUNDS.north);
  });
});

describe('formatBoundingBox', () => {
  it('emits west,south,east,north in the order the API parses', () => {
    expect(
      formatBoundingBox({ west: 31.1, south: 30, east: 31.3, north: 30.2 }),
    ).toBe('31.1,30,31.3,30.2');
  });

  it('clamps before formatting, so an out-of-extent view still queries', () => {
    const value = formatBoundingBox({
      west: 20,
      south: 10,
      east: 45,
      north: 50,
    });
    const [west, south, east, north] = value.split(',').map(Number);
    expect(west).toBeGreaterThanOrEqual(CAIRO_BOUNDS.west);
    expect(south).toBeGreaterThanOrEqual(CAIRO_BOUNDS.south);
    expect(east).toBeLessThanOrEqual(CAIRO_BOUNDS.east);
    expect(north).toBeLessThanOrEqual(CAIRO_BOUNDS.north);
  });
});

describe('parseBoundingBox', () => {
  it('reads a well-formed value from the URL', () => {
    expect(parseBoundingBox('31.1,30,31.3,30.2')).toEqual({
      west: 31.1,
      south: 30,
      east: 31.3,
      north: 30.2,
    });
  });

  it.each([
    ['nothing', undefined],
    ['an empty value', ''],
    ['too few numbers', '31.1,30,31.3'],
    ['non-numeric parts', '31.1,30,west,30.2'],
    ['a reversed longitude range', '31.3,30,31.1,30.2'],
    ['a reversed latitude range', '31.1,30.2,31.3,30'],
  ])('rejects %s', (_label, value) => {
    expect(parseBoundingBox(value)).toBeUndefined();
  });
});

describe('boundingBoxFromRadius', () => {
  it('contains the circle it was built from', () => {
    const box = boundingBoxFromRadius(CAIRO_CENTER, 3);
    const north = { latitude: box.north, longitude: CAIRO_CENTER.longitude };
    const east = { latitude: CAIRO_CENTER.latitude, longitude: box.east };
    expect(haversineKm(CAIRO_CENTER, north)).toBeGreaterThanOrEqual(2.9);
    expect(haversineKm(CAIRO_CENTER, east)).toBeGreaterThanOrEqual(2.9);
  });

  it('stays inside the governed extent for a radius larger than the city', () => {
    const box = boundingBoxFromRadius(CAIRO_CENTER, 500);
    expect(box).toEqual(CAIRO_BOUNDS);
  });
});

describe('withinRadius', () => {
  it('accepts a point inside and rejects the corner of its envelope', () => {
    const radiusKm = 2;
    const box = boundingBoxFromRadius(CAIRO_CENTER, radiusKm);
    const corner = { latitude: box.north, longitude: box.east };
    expect(withinRadius(CAIRO_CENTER, CAIRO_CENTER, radiusKm)).toBe(true);
    // The corner is ~radius * √2 away: this is what the client-side cull drops.
    expect(withinRadius(corner, CAIRO_CENTER, radiusKm)).toBe(false);
  });
});

describe('boundingBoxesEqual', () => {
  const box = { west: 31.1, south: 30, east: 31.3, north: 30.2 };

  it('treats a sub-metre drift as the same search area', () => {
    expect(boundingBoxesEqual(box, { ...box, west: 31.100005 })).toBe(true);
  });

  it('treats a real pan as a different search area', () => {
    expect(boundingBoxesEqual(box, { ...box, west: 31.2 })).toBe(false);
  });

  it('compares absence to absence', () => {
    expect(boundingBoxesEqual(undefined, undefined)).toBe(true);
    expect(boundingBoxesEqual(box, undefined)).toBe(false);
  });
});
