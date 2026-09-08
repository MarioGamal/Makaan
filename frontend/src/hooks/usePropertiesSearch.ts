import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSWR from 'swr';

import type {
  Locale,
  ParticipationLabel,
  PublicListingCard,
  PublicListingSearchResponse,
  PublicSort,
} from '@makaan/shared/types/marketplace';

import {
  boundingBoxesEqual,
  boundingBoxFromRadius,
  formatBoundingBox,
  withinRadius,
  type BoundingBox,
  type LatLng,
} from '../lib/geo';
import {
  searchListings,
  type ListingSearchParams,
} from '../services/listings.service';

/** Exactly the public search contract — nothing a visitor could not select. */
export type PropertyFilters = {
  purpose?: 'sale' | 'long_term_rent';
  areaId?: string[];
  propertyType?: string[];
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  participation?: ParticipationLabel;
  sort?: PublicSort;
};

/**
 * Either half of a map search: the visible envelope, or a point and a radius.
 * A radius becomes the envelope that contains it, because the API filters on
 * an envelope; the corners are then culled in the browser.
 */
export type MapArea = {
  bbox?: BoundingBox;
  center?: LatLng;
  radiusKm?: number;
};

export type SearchState = {
  filters: PropertyFilters;
  page: number;
  mapArea: MapArea;
};

export type PropertiesSearchOptions = {
  locale: Locale;
  initialFilters?: PropertyFilters;
  initialPage?: number;
  initialMapArea?: MapArea;
  pageSize?: number;
  /**
   * `manual` waits for `commitMapArea` — the "search this area" button — so
   * results do not shift under the cursor mid-drag. `live` follows the map
   * once it settles.
   */
  mapSearchMode?: 'manual' | 'live';
  /** Server-rendered first page, so the grid paints before any fetch. */
  fallbackData?: PublicListingSearchResponse;
  /** Fires when the search state changes, for URL synchronisation. */
  onStateChange?: (state: SearchState) => void;
};

const FILTER_KEYS = [
  'purpose',
  'areaId',
  'propertyType',
  'priceMin',
  'priceMax',
  'sizeMin',
  'sizeMax',
  'bedroomsMin',
  'bedroomsMax',
  'participation',
] as const satisfies readonly (keyof PropertyFilters)[];

const LIVE_MAP_SETTLE_MS = 400;

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

/** Stable key order, so two equal searches never produce two cache entries. */
function serializeParams(params: ListingSearchParams): string {
  return JSON.stringify(
    Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const value = params[key as keyof ListingSearchParams];
        if (!isEmpty(value)) accumulator[key] = value;
        return accumulator;
      }, {}),
  );
}

/**
 * Drops keys with no value. `getServerSideProps` needs this too: Next refuses
 * to serialise `undefined` into page props, so an unset filter must be absent
 * rather than present-and-undefined.
 */
export function pruneFilters(filters: PropertyFilters): PropertyFilters {
  const next: PropertyFilters = { ...filters };
  FILTER_KEYS.forEach((key) => {
    if (isEmpty(next[key])) delete next[key];
  });
  // Sort is not a filter — it never counts as one — but it still has to go.
  if (isEmpty(next.sort)) delete next.sort;
  return next;
}

export function buildSearchParams(
  filters: PropertyFilters,
  options: {
    locale: Locale;
    page: number;
    pageSize: number;
    mapArea?: MapArea;
  },
): ListingSearchParams {
  const { locale, page, pageSize, mapArea } = options;
  const box =
    mapArea?.bbox ??
    (mapArea?.center && mapArea.radiusKm
      ? boundingBoxFromRadius(mapArea.center, mapArea.radiusKm)
      : undefined);
  return {
    locale,
    purpose: filters.purpose,
    areaId: filters.areaId,
    propertyType: filters.propertyType,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    sizeMin: filters.sizeMin,
    sizeMax: filters.sizeMax,
    bedroomsMin: filters.bedroomsMin,
    bedroomsMax: filters.bedroomsMax,
    participation: filters.participation,
    sort: filters.sort ?? 'newest',
    bbox: box ? formatBoundingBox(box) : undefined,
    page,
    pageSize,
  };
}

/** The query string for a `/browse` link showing the same search. */
export function toBrowseQuery(params: ListingSearchParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (key === 'locale' || key === 'pageSize' || isEmpty(value)) return;
    // Defaults stay out of the URL, so a plain search has a clean address.
    if (key === 'page' && value === 1) return;
    if (key === 'sort' && value === 'newest') return;
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else query.set(key, String(value));
  });
  return query.toString();
}

/**
 * Map-aware search state for the public marketplace.
 *
 * Two things make this more than `useSWR` around a query object:
 *
 * 1. A dragged map fires a move event per animation frame. Those land in a ref
 *    and collapse into at most one state change, so the results grid and every
 *    card stop re-rendering during a drag. The public setters read the same
 *    refs, which keeps their identity stable for the whole session — a memoised
 *    child never re-renders because a callback was rebuilt.
 * 2. The request key is deferred, so a burst of changes coalesces into a single
 *    fetch while the previous results stay on screen instead of collapsing into
 *    a spinner.
 */
export function usePropertiesSearch({
  locale,
  initialFilters = {},
  initialPage = 1,
  initialMapArea = {},
  pageSize = 20,
  mapSearchMode = 'manual',
  fallbackData,
  onStateChange,
}: PropertiesSearchOptions) {
  const [filters, setFiltersState] = useState<PropertyFilters>(() =>
    pruneFilters(initialFilters),
  );
  const [page, setPageState] = useState(initialPage);
  const [mapArea, setMapAreaState] = useState<MapArea>(initialMapArea);
  /** True while the map has moved away from the committed search area. */
  const [mapDirty, setMapDirty] = useState(false);

  /*
   * The refs are the source of truth for the callbacks below; state exists to
   * render. Every write goes through one of these setters, so they cannot
   * drift, and no callback needs the current value in its dependency list.
   */
  const filtersRef = useRef(filters);
  const pageRef = useRef(page);
  const mapAreaRef = useRef(mapArea);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Move events accumulate here rather than in state: a drag must not render.
  const pendingBoxRef = useRef<BoundingBox | undefined>(initialMapArea.bbox);
  const frameRef = useRef<number | undefined>(undefined);
  const settleTimerRef = useRef<number | undefined>(undefined);
  const committedBoxRef = useRef<BoundingBox | undefined>(initialMapArea.bbox);

  const commit = useCallback((next: Partial<SearchState>) => {
    if (next.filters) {
      filtersRef.current = next.filters;
      setFiltersState(next.filters);
    }
    if (next.mapArea) {
      mapAreaRef.current = next.mapArea;
      setMapAreaState(next.mapArea);
    }
    if (next.page !== undefined) {
      pageRef.current = next.page;
      setPageState(next.page);
    }
    onStateChangeRef.current?.({
      filters: filtersRef.current,
      page: pageRef.current,
      mapArea: mapAreaRef.current,
    });
  }, []);

  const params = useMemo(
    () => buildSearchParams(filters, { locale, page, pageSize, mapArea }),
    [filters, locale, mapArea, page, pageSize],
  );
  const serialized = useMemo(() => serializeParams(params), [params]);
  /*
   * The deferred key is what actually fetches. React keeps rendering the
   * previous key's data until the new one is ready, which is why the grid does
   * not flash while filters are being adjusted.
   */
  const deferredKey = useDeferredValue(serialized);
  const isPending = deferredKey !== serialized;

  // The server-rendered page seeds exactly the search it was rendered for.
  const initialKeyRef = useRef(serialized);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['public-listings', deferredKey] as const,
    ([, key]) => searchListings(JSON.parse(key) as ListingSearchParams),
    {
      keepPreviousData: true,
      fallbackData:
        deferredKey === initialKeyRef.current ? fallbackData : undefined,
      revalidateOnFocus: false,
    },
  );

  /*
   * A radius search asks the API for the envelope around the circle, so the
   * corners come back too. Dropping them here keeps the answer honest: what is
   * shown is what is genuinely within the radius.
   */
  const listings = useMemo<PublicListingCard[]>(() => {
    const items = data?.items ?? [];
    const { center, radiusKm } = mapArea;
    if (!center || !radiusKm) return items;
    return items.filter((listing) =>
      listing.publicLocation.mode === 'approximate'
        ? withinRadius(
            {
              latitude: listing.publicLocation.latitude,
              longitude: listing.publicLocation.longitude,
            },
            center,
            radiusKm,
          )
        : false,
    );
  }, [data?.items, mapArea]);

  const patchFilters = useCallback(
    (patch: Partial<PropertyFilters>) => {
      // Any filter change invalidates the page offset it was counted from.
      commit({
        filters: pruneFilters({ ...filtersRef.current, ...patch }),
        page: 1,
      });
    },
    [commit],
  );

  const replaceFilters = useCallback(
    (next: PropertyFilters) => commit({ filters: pruneFilters(next), page: 1 }),
    [commit],
  );

  const resetFilters = useCallback(() => {
    committedBoxRef.current = undefined;
    pendingBoxRef.current = undefined;
    setMapDirty(false);
    commit({ filters: {}, page: 1, mapArea: {} });
  }, [commit]);

  const setPage = useCallback(
    (next: number) => commit({ page: Math.max(1, next) }),
    [commit],
  );

  const nextPage = useCallback(() => setPage(pageRef.current + 1), [setPage]);
  const previousPage = useCallback(
    () => setPage(pageRef.current - 1),
    [setPage],
  );

  const commitBox = useCallback(
    (box: BoundingBox) => {
      committedBoxRef.current = box;
      setMapDirty(false);
      commit({ mapArea: { ...mapAreaRef.current, bbox: box }, page: 1 });
    },
    [commit],
  );

  /**
   * Called for every map move. Nothing renders until the box has changed
   * enough to matter, and even then only a boolean flips.
   */
  const handleMapMove = useCallback(
    (box: BoundingBox) => {
      pendingBoxRef.current = box;
      if (frameRef.current !== undefined) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = undefined;
        const pending = pendingBoxRef.current;
        if (!pending) return;
        const moved = !boundingBoxesEqual(pending, committedBoxRef.current);
        setMapDirty((current) => (current === moved ? current : moved));

        if (mapSearchMode !== 'live') return;
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = window.setTimeout(() => {
          const latest = pendingBoxRef.current;
          if (latest && !boundingBoxesEqual(latest, committedBoxRef.current)) {
            commitBox(latest);
          }
        }, LIVE_MAP_SETTLE_MS);
      });
    },
    [commitBox, mapSearchMode],
  );

  /** "Search this area": promotes the visible envelope into the query. */
  const commitMapArea = useCallback(() => {
    const pending = pendingBoxRef.current;
    if (pending) commitBox(pending);
  }, [commitBox]);

  const clearMapArea = useCallback(() => {
    committedBoxRef.current = undefined;
    pendingBoxRef.current = undefined;
    setMapDirty(false);
    commit({ mapArea: {}, page: 1 });
  }, [commit]);

  /** Centre and radius, for "homes near this one". */
  const setRadiusArea = useCallback(
    (center: LatLng, radiusKm: number) => {
      committedBoxRef.current = boundingBoxFromRadius(center, radiusKm);
      commit({ mapArea: { center, radiusKm }, page: 1 });
    },
    [commit],
  );

  const activeFilterCount = useMemo(
    () => FILTER_KEYS.filter((key) => !isEmpty(filters[key])).length,
    [filters],
  );

  return {
    filters,
    patchFilters,
    replaceFilters,
    resetFilters,
    activeFilterCount,

    page,
    setPage,
    nextPage,
    previousPage,

    listings,
    response: data,
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    /** Only the first load has nothing to show; later ones keep the grid. */
    isLoading: isLoading && !data,
    isRefreshing: isValidating || isPending,
    error,
    retry: useCallback(() => mutate(), [mutate]),

    mapArea,
    mapDirty,
    handleMapMove,
    commitMapArea,
    clearMapArea,
    setRadiusArea,

    params,
    browseQuery: useMemo(() => toBrowseQuery(params), [params]),
  };
}
