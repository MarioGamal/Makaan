import type { PublicListingCard } from '@makaan/shared/types/marketplace';

import { Button, Card } from '../ui';

/** Credential-free map boundary: only approved approximate public locations become pins. */
export function SchematicMap({
  listings,
  selectedId,
  onSelect,
  labels,
}: {
  listings: PublicListingCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  labels: Record<string, string>;
}) {
  const pins = listings.filter(
    (listing) => listing.publicLocation.mode === 'approximate',
  );
  return (
    <Card
      className="relative min-h-[22rem] overflow-hidden bg-primary-soft p-0"
      aria-label={labels.map}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(35deg, transparent 46%, #125c4e22 47%, #125c4e22 53%, transparent 54%), linear-gradient(-20deg, transparent 47%, #b8643b33 48%, #b8643b33 52%, transparent 53%)',
          backgroundSize: '120px 120px',
        }}
      />
      <div className="relative flex h-full min-h-[22rem] flex-col justify-between p-5">
        <p className="max-w-sm text-sm text-ink-muted">
          {labels.mapDescription}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pins.map((listing, index) => (
            <Button
              aria-pressed={selectedId === listing.id}
              className="justify-start"
              key={listing.id}
              onClick={() => onSelect(listing.id)}
              size="sm"
              variant={selectedId === listing.id ? 'primary' : 'secondary'}
            >
              {labels.pin} {index + 1}
            </Button>
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          {listings.length - pins.length > 0
            ? `${listings.length - pins.length} ${labels.areaOnly}`
            : labels.allPinned}
        </p>
      </div>
    </Card>
  );
}
