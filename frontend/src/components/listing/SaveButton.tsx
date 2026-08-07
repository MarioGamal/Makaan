import { useEffect, useState } from 'react';

import { useLocale } from '../layout/LocaleProvider';
import { Button } from '../ui/Button';
import { catalogues } from '../../i18n';
import { fetchSavedListings, setListingSaved } from '../../services/saved.service';

export function SaveButton({
  listingId,
  compact = false,
  onSavedChange,
}: {
  listingId: string;
  compact?: boolean;
  onSavedChange?: (saved: boolean) => void;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchSavedListings()
      .then((items) => {
        if (active) setSaved(items.some((item) => item.id === listingId));
      })
      .catch(() => {
        if (active) setMessage(copy.saveUnavailable);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [copy.saveUnavailable, listingId]);

  const toggle = async () => {
    const nextSaved = !saved;
    setLoading(true);
    setMessage(null);
    try {
      const result = await setListingSaved(listingId, nextSaved);
      setSaved(result.saved);
      onSavedChange?.(result.saved);
      setMessage(result.saved ? copy.savedConfirmation : copy.unsavedConfirmation);
    } catch {
      setMessage(copy.saveUnavailable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'w-full' : ''}>
      <Button
        aria-pressed={saved}
        fullWidth={compact}
        loading={loading}
        onClick={() => void toggle()}
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
