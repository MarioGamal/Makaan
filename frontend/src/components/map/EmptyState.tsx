export function EmptyState({
  variant,
  onClear,
}: {
  variant: 'filters' | 'outside-cairo';
  onClear: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="pointer-events-auto max-w-sm rounded-3xl border border-ink/10 bg-white/95 p-6 text-center shadow-xl backdrop-blur">
        <h2 className="text-xl font-semibold">
          {variant === 'outside-cairo'
            ? 'Makaan serves Cairo only'
            : 'No listings match your filters'}
        </h2>
        <p className="mt-3 text-sm text-ink/70">
          {variant === 'outside-cairo'
            ? 'Try centering back on Cairo to continue browsing.'
            : 'Clear your current filters or move the map to explore more homes.'}
        </p>
        <button
          className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

