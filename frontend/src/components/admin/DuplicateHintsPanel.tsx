import Link from 'next/link';

import type { DuplicateHint } from '../../services/admin-auth.service';

export function DuplicateHintsPanel({ hints }: { hints: DuplicateHint[] }) {
  if (hints.length === 0) {
    return (
      <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Duplicate hints</h2>
        <p className="mt-3 text-sm text-ink/70">
          No potential duplicates found.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Duplicate hints</h2>
      <div className="mt-4 space-y-4">
        {hints.map((hint) => (
          <article
            className="rounded-2xl border border-ink/10 bg-sand/30 p-4"
            key={hint.listingId}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  Listing {hint.listingId.slice(0, 8)}
                </p>
                <Link
                  className="mt-1 inline-block text-sm text-oasis"
                  href={`/admin/listings/${hint.listingId}`}
                >
                  Open side-by-side review
                </Link>
              </div>
              <span className="text-sm font-semibold">{hint.confidence}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-ink/10">
              <div
                className="h-2 rounded-full bg-clay"
                style={{ width: `${Math.min(hint.confidence, 100)}%` }}
              />
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/70">
              {hint.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
