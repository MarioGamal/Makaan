import { useState } from 'react';

import type { PublicListingCard } from '@makaan/shared/types/marketplace';

import { useSavedListings } from '../../hooks/useSavedListings';
import { useLocale } from '../layout/LocaleProvider';
import { Button } from '../ui/Button';
import { HeartIcon } from '../ui/icons';
import { catalogues } from '../../i18n';

/**
 * The labelled save control used where there is room for words: the detail
 * page and the saved list. Card grids use {@link SaveToggle} instead.
 */
export function SaveButton({
  listingId,
  listing,
  compact = false,
  onSavedChange,
}: {
  listingId: string;
  /** Lets the shared cache update before the server answers. */
  listing?: PublicListingCard;
  compact?: boolean;
  onSavedChange?: (saved: boolean) => void;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const { isSaved, toggle, isLoading } = useSavedListings();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const saved = isSaved(listingId);

  const onClick = async () => {
    const next = !saved;
    setPending(true);
    setMessage(null);
    try {
      await toggle(listingId, next, listing);
      onSavedChange?.(next);
      setMessage(next ? copy.savedConfirmation : copy.unsavedConfirmation);
    } catch {
      setMessage(copy.saveUnavailable);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={compact ? 'w-full' : ''}>
      <Button
        aria-pressed={saved}
        data-testid="save-listing-button"
        fullWidth={compact}
        icon={
          <HeartIcon
            className={`size-[1.1rem] ${saved ? 'text-danger' : ''}`}
            filled={saved}
          />
        }
        loading={pending || isLoading}
        onClick={() => void onClick()}
        variant="secondary"
      >
        {saved ? copy.unsave : copy.save}
      </Button>
      {message ? (
        <p className="mt-2 text-xs text-ink-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
