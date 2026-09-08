import { useEffect, useId, useRef, useState } from 'react';

import type { PublicArea } from '@makaan/shared/types/marketplace';

import { catalogues } from '../../i18n';
import { searchAreas } from '../../services/listings.service';
import { useLocale } from '../layout/LocaleProvider';
import { CloseIcon, PinIcon, SearchIcon } from '../ui/icons';

const DEBOUNCE_MS = 220;
const MIN_QUERY_LENGTH = 2;

/**
 * Governed-area autocomplete.
 *
 * Implements the ARIA combobox pattern rather than a bare input with a list:
 * the arrow keys move an `aria-activedescendant` through the options, Enter
 * chooses, Escape closes. Only governed areas are selectable, so a free-text
 * place never reaches the query.
 */
export function AreaSearchBar({
  label,
  onSelect,
  initialQuery = '',
  className = '',
  testId = 'area-search',
}: {
  label: string;
  onSelect: (area: PublicArea | undefined) => void;
  initialQuery?: string;
  className?: string;
  testId?: string;
}) {
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PublicArea[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = `${inputId}-listbox`;
  /** Set when a selection filled the field, so it is not searched again. */
  const selectedRef = useRef(false);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchAreas(query, locale)
        .then((areas) => {
          setResults(areas);
          setActiveIndex(-1);
          setOpen(areas.length > 0);
        })
        .catch(() => {
          setResults([]);
          setOpen(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [locale, query]);

  // A click elsewhere closes the list without choosing anything.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const choose = (area: PublicArea) => {
    selectedRef.current = true;
    setQuery(locale === 'ar' ? area.nameAr : area.nameEn);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(area);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(undefined);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next = current + delta;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      const area = results[activeIndex];
      if (area) choose(area);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-ui border border-border bg-surface-raised ps-3.5 pe-2 transition-colors duration-200 focus-within:border-primary hover:border-border-strong">
        <SearchIcon className="size-[1.15rem] shrink-0 text-ink-subtle" />
        <input
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          autoComplete="off"
          className="w-full min-w-0 bg-transparent py-2.5 text-ink outline-none focus-visible:shadow-none"
          data-testid={testId}
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          onKeyDown={onKeyDown}
          placeholder={label}
          role="combobox"
          type="text"
          value={query}
        />
        {query ? (
          <button
            aria-label={copy.removeFilter}
            className="grid size-tap shrink-0 place-items-center rounded-pill text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink"
            data-testid={`${testId}-clear`}
            onClick={clear}
            type="button"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 ? (
        // A div, not a list: a listbox may only contain options, and a <li>
        // between the two is exactly the nesting axe rejects.
        <div
          className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 max-h-72 animate-fade-up overflow-auto rounded-panel border border-border bg-surface-raised p-1.5 shadow-float"
          data-testid={`${testId}-options`}
          id={listId}
          role="listbox"
        >
          {results.map((area, index) => (
            <button
              aria-selected={index === activeIndex}
              className={`flex w-full items-center gap-2.5 rounded-ui px-3 py-2.5 text-start text-sm transition-colors ${
                index === activeIndex
                  ? 'bg-primary-soft text-primary'
                  : 'hover:bg-surface-muted'
              }`}
              data-testid="area-option"
              id={`${listId}-option-${index}`}
              key={area.id}
              onClick={() => choose(area)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              type="button"
            >
              <PinIcon className="size-4 shrink-0 text-primary" />
              <span className="font-semibold">
                {locale === 'ar' ? area.nameAr : area.nameEn}
              </span>
              <span className="truncate text-ink-subtle">
                {locale === 'ar' ? area.nameEn : area.nameAr}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
