import { useEffect, useState } from 'react';

import { searchAreas } from '../../services/listings.service';

type AreaSuggestion = {
  id: string;
  name_en: string;
  name_ar: string;
  bbox: [number, number, number, number];
};

export function AreaSearchBar({
  onSelect,
}: {
  onSelect: (area: AreaSuggestion) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AreaSuggestion[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setResults(await searchAreas(query));
      } catch {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <input
        className="w-full rounded-full border border-ink/10 bg-white/90 px-4 py-3 shadow-sm"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Cairo areas"
        value={query}
      />
      {results.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
          {results.map((area) => (
            <button
              className="block w-full border-b border-ink/5 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-sand"
              key={area.id}
              onClick={() => {
                setQuery(area.name_en);
                setResults([]);
                onSelect(area);
              }}
              type="button"
            >
              <div className="font-medium">{area.name_en}</div>
              <div className="text-ink/60">{area.name_ar}</div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
