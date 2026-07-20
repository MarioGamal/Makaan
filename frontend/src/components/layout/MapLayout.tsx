import Link from 'next/link';

import type { ReactNode } from 'react';

import type { ListingCard } from '../../services/listings.service';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(price);

function ListingSidebarCard({ listing }: { listing: ListingCard }) {
  return (
    <Link
      className="block rounded-3xl border border-ink/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5"
      href={`/listings/${listing.id}`}
    >
      <div className="mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
        {listing.photos[0] ? (
          <img
            alt={listing.propertyType}
            className="h-full w-full object-cover"
            src={listing.photos[0]}
          />
        ) : null}
      </div>
      <p className="font-semibold">{formatPrice(listing.priceEgp)}</p>
      <p className="text-sm text-ink/70">
        {listing.propertyType} · {listing.bedrooms} bed · {listing.bathrooms} bath
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-oasis">
        {listing.location.areaName ?? 'Cairo'}
      </p>
    </Link>
  );
}

export function MapLayout({
  filters,
  toolbar,
  map,
  listings,
}: {
  filters: ReactNode;
  toolbar: ReactNode;
  map: ReactNode;
  listings: ListingCard[];
}) {
  return (
    <main className="min-h-screen bg-sand text-ink">
      <div className="flex min-h-screen flex-col gap-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">{toolbar}</div>
        {filters}
        <div className="grid flex-1 gap-4 lg:grid-cols-[70%_30%]">
          <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-xl">
            {map}
          </div>
          <aside className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-xl">
            <div className="border-b border-ink/10 px-5 py-4">
              <h2 className="font-semibold">Listings nearby</h2>
            </div>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-4">
              {listings.map((listing) => (
                <ListingSidebarCard key={listing.id} listing={listing} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
