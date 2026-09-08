import useSWR from 'swr';

import {
  searchListings,
  type ListingSearchParams,
} from '../services/listings.service';

export function useListings(params: ListingSearchParams | null) {
  const key = params
    ? (['public-listings', JSON.stringify(params)] as const)
    : null;
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => searchListings(params!),
    {
      keepPreviousData: true,
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
