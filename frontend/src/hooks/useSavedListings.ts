import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import type { PublicListingCard } from '@makaan/shared/types/marketplace';

import { fetchSavedListings, setListingSaved } from '../services/saved.service';

export const SAVED_LISTINGS_KEY = 'saved-listings';

/**
 * One shared cache for the anonymous visitor's saved homes.
 *
 * Every card previously asked the API whether it was saved, so a grid of
 * twenty cards opened twenty requests for the same list. SWR deduplicates them
 * into one, and a toggle updates the cache optimistically so the heart
 * responds on the same frame it was pressed.
 */
export function useSavedListings() {
  const { data, error, isLoading, mutate } = useSWR(
    SAVED_LISTINGS_KEY,
    fetchSavedListings,
    { revalidateOnFocus: false },
  );

  const savedIds = useMemo(
    () => new Set((data ?? []).map((listing) => listing.id)),
    [data],
  );

  const toggle = useCallback(
    async (listingId: string, next: boolean, listing?: PublicListingCard) => {
      const optimistic = (current: PublicListingCard[] = []) =>
        next
          ? current.some((item) => item.id === listingId) || !listing
            ? current
            : [{ ...listing, saved: true }, ...current]
          : current.filter((item) => item.id !== listingId);

      await mutate(
        async (current: PublicListingCard[] = []) => {
          await setListingSaved(listingId, next);
          return optimistic(current);
        },
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          // The server owns the truth; the optimistic list is only a preview.
          revalidate: true,
        },
      );
    },
    [mutate],
  );

  return {
    listings: data ?? [],
    savedIds,
    isSaved: useCallback(
      (listingId: string) => savedIds.has(listingId),
      [savedIds],
    ),
    toggle,
    isLoading,
    error,
    retry: useCallback(() => mutate(), [mutate]),
  };
}
