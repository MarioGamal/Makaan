import useSWR from 'swr';

import type { PublicListingSearchResponse } from '@makaan/shared/types/marketplace';

import {
  searchListings,
  type ListingSearchParams,
} from '../services/listings.service';

/**
 * A single public search with no map state — featured rows, related homes.
 * Map-driven screens use `usePropertiesSearch` instead.
 */
export function useListings(
  params: ListingSearchParams,
  options: { fallbackData?: PublicListingSearchResponse } = {},
) {
  const key = ['public-listings', JSON.stringify(params)] as const;
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => searchListings(params),
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
