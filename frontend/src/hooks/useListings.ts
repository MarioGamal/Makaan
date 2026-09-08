import useSWR from 'swr';

import type { PublicListingSearchResponse } from '@makaan/shared/types/marketplace';

import {
  searchListings,
  type ListingSearchParams,
} from '../services/listings.service';

/**
 * A single public search with no map state — featured rows, related homes.
 * Map-driven screens use `usePropertiesSearch` instead.
 *
 * `params` may be null to hold the request back until the caller is ready, and
 * `fallbackData` seeds the cache with a server-rendered response so a
 * server-rendered grid revalidates instead of starting empty.
 */
export function useListings(
  params: ListingSearchParams | null,
  options: { fallbackData?: PublicListingSearchResponse } = {},
) {
  const key = params
    ? (['public-listings', JSON.stringify(params)] as const)
    : null;
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => searchListings(params!),
    {
      keepPreviousData: true,
      fallbackData: options.fallbackData,
    },
  );

  return {
    response: data,
    listings: data?.items ?? [],
    error,
    isLoading,
    retry: () => mutate(),
  };
}
