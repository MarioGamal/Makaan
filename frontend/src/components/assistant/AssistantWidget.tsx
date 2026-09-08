import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';

import type {
  AssistantFilters,
  AssistantMessageResponse,
} from '@makaan/shared/types/assistant';
import type { PublicListingCard as Listing } from '@makaan/shared/types/marketplace';

import { assistantCopy } from '../../i18n/assistant';
import { formatCurrency, formatNumber, propertyTypeLabel } from '../../i18n';
import { askAssistant } from '../../services/assistant.service';
import { MarketplaceRequestError } from '../../services/saved.service';
import { useLocale } from '../layout/LocaleProvider';
import { Badge, Button, LiveRegion } from '../ui';

type Turn =
  | { id: string; author: 'visitor'; text: string }
  | { id: string; author: 'assistant'; payload: AssistantMessageResponse };

let turnCounter = 0;
const nextTurnId = () => `turn-${(turnCounter += 1)}`;

/**
 * Compact result card for a home suggested inside the conversation.
 * It renders only fields from the public listing projection, which is the sole
 * source the assistant endpoint reads from.
 */
function AssistantListing({
  listing,
  copy,
  locale,
  onNavigate,
}: {
  listing: Listing;
  copy: Record<string, string>;
  locale: 'ar' | 'en';
  onNavigate: () => void;
}) {
  const area = locale === 'ar' ? listing.area.nameAr : listing.area.nameEn;
  return (
    <Link
      className="flex gap-3 rounded-ui border border-border bg-surface-raised p-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      href={`/listings/${listing.id}`}
      onClick={onNavigate}
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-[0.6rem] bg-surface-muted">
        {listing.coverImage ? (
          <img
            alt={listing.coverImage.alt}
            className="h-full w-full object-cover"
            src={listing.coverImage.url}
          />
        ) : (
          <span className="sr-only">{copy.noImage}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {formatCurrency(listing.priceEgp, locale)}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {propertyTypeLabel(locale, listing.propertyType)} · {area} ·{' '}
          {formatNumber(listing.bedrooms, locale)}
          {locale === 'ar' ? ' غرف' : ' bd'} ·{' '}
          {formatNumber(listing.sizeSqm, locale)} m²
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {copy[listing.participation]}
        </p>
      </div>
    </Link>
  );
}

export function AssistantWidget() {
  const { locale } = useLocale();
  const copy = assistantCopy[locale];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  /** Filters from the latest answer, sent back so follow-up questions keep context. */
  const [context, setContext] = useState<AssistantFilters>();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [turns, pending]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const submit = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || pending) return;
    setDraft('');
    setError(undefined);
    setTurns((current) => [
      ...current,
      { id: nextTurnId(), author: 'visitor', text: trimmed },
    ]);
    setPending(true);
    try {
      const payload = await askAssistant(trimmed, locale, context);
      setContext(payload.filters);
      setTurns((current) => [
        ...current,
        { id: nextTurnId(), author: 'assistant', payload },
      ]);
    } catch (requestError) {
      const rateLimited =
        requestError instanceof MarketplaceRequestError &&
        requestError.code === 'RATE_LIMITED';
      setError(rateLimited ? copy.rateLimited : copy.error);
    } finally {
      setPending(false);
    }
  };

  const examples = [copy.exampleOne, copy.exampleTwo, copy.exampleThree];

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? copy.close : copy.open}
        className="fixed bottom-5 end-5 z-40 flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-panel transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">{open ? '×' : '؟'}</span>
        <span className="hidden sm:inline">{copy.title}</span>
      </button>

      {open ? (
        <div
          aria-label={copy.title}
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[min(34rem,80vh)] flex-col overflow-hidden rounded-panel border border-border bg-surface shadow-panel sm:inset-x-auto sm:end-5 sm:w-[24rem]"
          id={panelId}
          ref={panelRef}
          role="dialog"
        >
          <header className="flex items-start justify-between gap-2 border-b border-border bg-surface-raised px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">{copy.title}</p>
              <p className="text-xs text-ink-muted">{copy.subtitle}</p>
            </div>
            <button
              aria-label={copy.close}
              className="min-h-8 min-w-8 rounded-full text-lg text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setOpen(false)}
              type="button"
            >
              ×
            </button>
          </header>

          <div
            aria-label={copy.conversation}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            ref={logRef}
            role="log"
          >
            {turns.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">
                  {copy.emptyTitle}
                </p>
                <p className="text-sm text-ink-muted">{copy.intro}</p>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <button
                      className="rounded-full border border-border bg-surface-raised px-3 py-2 text-xs text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      key={example}
                      onClick={() => void submit(example)}
                      type="button"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {turns.map((turn) =>
              turn.author === 'visitor' ? (
                <p
                  className="ms-auto w-fit max-w-[85%] rounded-ui bg-primary px-3 py-2 text-sm text-white"
                  key={turn.id}
                >
                  <span className="sr-only">{copy.you}: </span>
                  {turn.text}
                </p>
              ) : (
                <div className="space-y-2" key={turn.id}>
                  <div className="w-fit max-w-[92%] rounded-ui bg-surface-muted px-3 py-2">
                    {/* Constitution VII: generated content is always identified. */}
                    <Badge className="mb-1" tone="info">
                      {copy.generatedBadge}
                    </Badge>
                    <p className="whitespace-pre-line text-sm text-ink">
                      <span className="sr-only">{copy.assistant}: </span>
                      {turn.payload.reply}
                    </p>
                  </div>

                  {turn.payload.listings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-ink-muted">
                        {copy.resultsLabel}
                      </p>
                      {turn.payload.listings.map((listing) => (
                        <AssistantListing
                          copy={copy}
                          key={listing.id}
                          listing={listing}
                          locale={turn.payload.locale}
                          onNavigate={() => setOpen(false)}
                        />
                      ))}
                      {turn.payload.totalMatches >
                      turn.payload.listings.length ? (
                        <Link
                          className="inline-block text-xs font-semibold text-primary underline"
                          href={`/browse?${turn.payload.browseQuery}`}
                          onClick={() => setOpen(false)}
                        >
                          {copy.seeAll}
                        </Link>
                      ) : null}
                    </div>
                  ) : null}

                  {turn.payload.suggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {turn.payload.suggestions.map((suggestion) => (
                        <button
                          className="rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          key={suggestion}
                          onClick={() => void submit(suggestion)}
                          type="button"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ),
            )}

            {pending ? (
              <p className="text-sm text-ink-muted">{copy.sending}</p>
            ) : null}
            {error ? (
              <p className="rounded-ui bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <LiveRegion>
            {pending
              ? copy.sending
              : (error ??
                (turns.at(-1)?.author === 'assistant'
                  ? (turns.at(-1) as Extract<Turn, { author: 'assistant' }>)
                      .payload.reply
                  : ''))}
          </LiveRegion>

          <form
            className="border-t border-border bg-surface-raised px-3 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(draft);
            }}
          >
            <div className="flex gap-2">
              <input
                aria-label={copy.placeholder}
                className="min-h-11 flex-1 rounded-ui border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                maxLength={500}
                onChange={(event) => setDraft(event.target.value)}
                // Chat inputs are expected to send on Enter; implicit form
                // submission alone does not reliably do that here.
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.shiftKey) return;
                  event.preventDefault();
                  void submit(draft);
                }}
                placeholder={copy.placeholder}
                ref={inputRef}
                value={draft}
              />
              <Button
                disabled={!draft.trim()}
                loading={pending}
                size="sm"
                type="submit"
              >
                {copy.send}
              </Button>
            </div>
            <p className="mt-2 text-[0.7rem] leading-snug text-ink-muted">
              {copy.disclaimer}
            </p>
          </form>
        </div>
      ) : null}
    </>
  );
}
