import Link from 'next/link';

import { ContactButtons } from '../listing/ContactButtons';
import { SaveButton } from '../listing/SaveButton';
import type { ListingCard } from '../../services/listings.service';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(price);

export function ListingPopup({ listing }: { listing: ListingCard }) {
  return (
    <div className="w-[260px] overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="h-36 bg-stone-200">
        {listing.photos[0] ? (
          <img
            alt={listing.propertyType}
            className="h-full w-full object-cover"
            src={listing.photos[0]}
          />
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-lg font-semibold">{formatPrice(listing.priceEgp)}</p>
          <p className="text-sm text-ink/65">
            {listing.propertyType} · {listing.bedrooms} bed · {listing.bathrooms} bath
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="flex-1 rounded-full bg-ink px-3 py-2 text-center text-sm font-medium text-white"
            href={`/listings/${listing.id}`}
          >
            View Details
          </Link>
        </div>
        <SaveButton compact listingId={listing.id} />
        <ContactButtons compact listingId={listing.id} />
      </div>
    </div>
  );
}
