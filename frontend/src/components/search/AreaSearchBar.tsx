import { useEffect, useId, useState } from 'react';

import type { PublicArea } from '@makaan/shared/types/marketplace';
import { useLocale } from '../layout/LocaleProvider';
import { searchAreas } from '../../services/listings.service';

export function AreaSearchBar({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (area: PublicArea) => void;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicArea[]>([]);
  const listId = useId();
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchAreas(query, locale)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [locale, query]);
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={listId}>
        {label}
      </label>
      <input
        aria-autocomplete="list"
        aria-controls={results.length ? listId : undefined}
        className="w-full rounded-ui border border-border bg-surface-raised px-4"
        id={listId}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={label}
        value={query}
      />
      {results.length ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-ui border border-border bg-surface-raised shadow-ui"
          role="listbox"
        >
          {results.map((area) => (
            <button
              className="block w-full border-b border-border px-4 py-3 text-start text-sm last:border-0 hover:bg-surface-muted"
              key={area.id}
              onClick={() => {
                setQuery(locale === 'ar' ? area.nameAr : area.nameEn);
                setResults([]);
                onSelect(area);
              }}
              role="option"
              type="button"
            >
              <span className="font-semibold">
                {locale === 'ar' ? area.nameAr : area.nameEn}
              </span>
              <span className="ms-2 text-ink-muted">
                {locale === 'ar' ? area.nameEn : area.nameAr}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
