import { useEffect, useState } from 'react';

import useSWR from 'swr';

import {
  type ListingSearchParams,
  searchListings,
} from '../services/listings.service';

const makeKey = (params: ListingSearchParams) =>
  ['listings', JSON.stringify(params)] as const;

export function useListings(params: ListingSearchParams) {
  const [debouncedParams, setDebouncedParams] = useState(params);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedParams(params), 300);
    return () => clearTimeout(timeout);
  }, [params]);

  const { data, error, isLoading } = useSWR(
    makeKey(debouncedParams),
    async () => searchListings(debouncedParams),
  );

  return {
    listings: data?.listings ?? [],
    total: data?.total ?? 0,
    bbox: data?.bbox ?? null,
    error,
    isLoading,
  };
}

