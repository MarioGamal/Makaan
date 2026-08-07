import useSWR from 'swr';

import {
  searchListings,
  type ListingSearchParams,
} from '../services/listings.service';

export function useListings(params: ListingSearchParams) {
  const key = ['public-listings', JSON.stringify(params)] as const;
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => searchListings(params),
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
