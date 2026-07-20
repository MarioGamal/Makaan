import { useEffect, useState } from 'react';

import {
  isSaved,
  saveListingId,
  subscribeToSavedListings,
  unsaveListingId,
} from '../../services/saved.service';

export function SaveButton({
  listingId,
  compact = false,
}: {
  listingId: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isSaved(listingId));
    sync();
    return subscribeToSavedListings(sync);
  }, [listingId]);

  const toggleSaved = () => {
    if (saved) {
      unsaveListingId(listingId);
      setSaved(false);
      return;
    }

    saveListingId(listingId);
    setSaved(true);
  };

  return (
    <button
      aria-label={saved ? 'Remove listing from saved items' : 'Save listing'}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        saved
          ? 'border-clay bg-clay text-white'
          : 'border-ink/10 bg-white text-ink'
      } ${compact ? 'w-full' : ''}`}
      onClick={toggleSaved}
      type="button"
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
