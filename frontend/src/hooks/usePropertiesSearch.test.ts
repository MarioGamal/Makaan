import { describe, expect, it } from 'vitest';

import { CAIRO_CENTER } from '../lib/geo';

import { buildSearchParams, toBrowseQuery } from './usePropertiesSearch';

const base = { locale: 'ar' as const, page: 1, pageSize: 20 };

describe('buildSearchParams', () => {
  it('passes both bedroom bounds, so an exact count is expressible', () => {
    const params = buildSearchParams({ bedroomsMin: 2, bedroomsMax: 2 }, base);
    expect(params.bedroomsMin).toBe(2);
    expect(params.bedroomsMax).toBe(2);
  });

  it('defaults the sort rather than leaving it to the server', () => {
    expect(buildSearchParams({}, base).sort).toBe('newest');
  });

  it('turns a centre and radius into the envelope the API filters on', () => {
    const params = buildSearchParams(
      {},
      { ...base, mapArea: { center: CAIRO_CENTER, radiusKm: 2 } },
    );
    const [west, south, east, north] = (params.bbox ?? '')
      .split(',')
      .map(Number);
    expect(west).toBeLessThan(CAIRO_CENTER.longitude);
    expect(east).toBeGreaterThan(CAIRO_CENTER.longitude);
    expect(south).toBeLessThan(CAIRO_CENTER.latitude);
    expect(north).toBeGreaterThan(CAIRO_CENTER.latitude);
  });

  it('prefers an explicit envelope over a radius', () => {
    const bbox = { west: 31.1, south: 30, east: 31.2, north: 30.1 };
    const params = buildSearchParams(
      {},
      {
        ...base,
        mapArea: { bbox, center: CAIRO_CENTER, radiusKm: 40 },
      },
    );
    expect(params.bbox).toBe('31.1,30,31.2,30.1');
  });
});

describe('toBrowseQuery', () => {
  it('keeps defaults and internals out of the address', () => {
    const query = toBrowseQuery(buildSearchParams({}, base));
    expect(query).toBe('');
  });

  it('repeats a key for each value of a multi-valued filter', () => {
    const query = toBrowseQuery(
      buildSearchParams({ propertyType: ['Apartment', 'Villa'] }, base),
    );
    expect(query).toBe('propertyType=Apartment&propertyType=Villa');
  });

  it('carries the filters a visitor set, including the page', () => {
    const query = new URLSearchParams(
      toBrowseQuery(
        buildSearchParams(
          {
            purpose: 'sale',
            priceMax: 3_000_000,
            participation: 'verified_owner',
            sort: 'price_asc',
          },
          { ...base, page: 3 },
        ),
      ),
    );
    expect(query.get('purpose')).toBe('sale');
    expect(query.get('priceMax')).toBe('3000000');
    expect(query.get('participation')).toBe('verified_owner');
    expect(query.get('sort')).toBe('price_asc');
    expect(query.get('page')).toBe('3');
  });
});
