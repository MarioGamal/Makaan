import { useState } from 'react';

import type { PublicListingCard } from '@makaan/shared/types/marketplace';

import { catalogues } from '../../i18n';
import { useSavedListings } from '../../hooks/useSavedListings';
import { useLocale } from '../layout/LocaleProvider';
import { HeartIcon } from '../ui/icons';

/**
 * The heart on a property card.
 *
 * Icon-only by design — it sits over the photograph — so the accessible name
 * carries the whole meaning and flips between save and remove.
 */
export function SaveToggle({
  listing,
  className = '',
}: {
  listing: PublicListingCard;
  className?: string;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const { isSaved, toggle } = useSavedListings();
  const [failed, setFailed] = useState(false);
  const saved = isSaved(listing.id);

  return (
    <button
      aria-label={saved ? copy.unsave : copy.save}
      aria-pressed={saved}
      className={`glass-strong grid size-tap place-items-center rounded-pill text-ink shadow-ui transition-all duration-200 ease-spring hover:scale-105 active:scale-95 ${className}`}
      data-testid="save-listing"
      onClick={(event) => {
        // The card is a link; saving must not navigate.
        event.preventDefault();
        event.stopPropagation();
        setFailed(false);
        void toggle(listing.id, !saved, listing).catch(() => setFailed(true));
      }}
      title={failed ? copy.saveUnavailable : saved ? copy.unsave : copy.save}
      type="button"
    >
      <HeartIcon
        className={`size-5 transition-colors duration-200 ${
          saved ? 'text-danger' : 'text-ink'
        }`}
        filled={saved}
      />
    </button>
  );
}
