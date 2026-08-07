import { useState } from 'react';

import { useLocale } from '../layout/LocaleProvider';
import { Button } from '../ui/Button';
import { catalogues } from '../../i18n';
import {
  contactIntentResolverUrl,
  createContactIntent,
} from '../../services/saved.service';

export function ContactButtons({
  listingId,
  compact = false,
}: {
  listingId: string;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [pending, setPending] = useState<'phone' | 'whatsapp' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const contact = async (channel: 'phone' | 'whatsapp') => {
    // Opening synchronously keeps the native resolver handoff from being blocked.
    const handoff = window.open('about:blank', '_blank');
    if (handoff) handoff.opener = null;
    setPending(channel);
    setMessage(null);
    try {
      const { token } = await createContactIntent(listingId, channel);
      const resolverUrl = contactIntentResolverUrl(token);
      if (handoff) handoff.location.assign(resolverUrl);
      else window.location.assign(resolverUrl);
    } catch {
      handoff?.close();
      setMessage(copy.contactUnavailable);
    } finally {
      setPending(null);
    }
  };

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          disabled={pending !== null}
          fullWidth={compact}
          loading={pending === 'whatsapp'}
          onClick={() => void contact('whatsapp')}
        >
          {copy.whatsApp}
        </Button>
        <Button
          disabled={pending !== null}
          fullWidth={compact}
          loading={pending === 'phone'}
          onClick={() => void contact('phone')}
          variant="secondary"
        >
          {copy.call}
        </Button>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-ink-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
