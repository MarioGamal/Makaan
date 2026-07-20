import { getContactRedirectUrl, trackContact } from '../../services/listings.service';

async function openContactLink(id: string, method: 'whatsapp' | 'call') {
  if (typeof window !== 'undefined') {
    const url = getContactRedirectUrl(id, method);
    const popup = method === 'whatsapp' ? window.open('', '_blank', 'noopener,noreferrer') : null;

    try {
      await trackContact(id, method);
    } finally {
      if (method === 'whatsapp') {
        if (popup) {
          popup.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        window.location.href = url;
      }
    }
  }
}

export function ContactButtons({
  listingId,
  compact = false,
}: {
  listingId: string;
  compact?: boolean;
}) {
  const primaryClass = compact
    ? 'rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white'
    : 'rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white';
  const secondaryClass = compact
    ? 'rounded-full border border-ink/10 px-3 py-2 text-sm font-semibold'
    : 'rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        className={primaryClass}
        onClick={() => void openContactLink(listingId, 'whatsapp')}
        type="button"
      >
        WhatsApp
      </button>
      <button
        className={secondaryClass}
        onClick={() => void openContactLink(listingId, 'call')}
        type="button"
      >
        Call
      </button>
    </div>
  );
}
