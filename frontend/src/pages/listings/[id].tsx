import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import { ContactButtons } from '../../components/listing/ContactButtons';
import { SaveButton } from '../../components/listing/SaveButton';
import { getListingById, type ListingDetail } from '../../services/listings.service';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(price);

export default function ListingDetailPage({
  listing,
}: {
  listing: ListingDetail;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = listing.photos[activeIndex];

  return (
    <main className="min-h-screen bg-sand px-4 py-6 text-ink md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link className="text-sm text-oasis" href="/">
          Back to map
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-sm">
            <div className="aspect-[4/3] bg-stone-200">
              {activePhoto ? (
                <img
                  alt={listing.propertyType}
                  className="h-full w-full object-cover"
                  src={activePhoto.url}
                />
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto p-4">
              {listing.photos.map((photo, index) => (
                <button
                  className={`h-20 w-24 flex-none overflow-hidden rounded-2xl border ${
                    index === activeIndex ? 'border-oasis' : 'border-ink/10'
                  }`}
                  key={photo.id}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <img
                    alt={`${listing.propertyType} ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={photo.url}
                  />
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-4 rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-oasis">
                {listing.purpose}
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{formatPrice(listing.priceEgp)}</h1>
              <p className="mt-2 text-ink/70">{listing.area.nameEn ?? 'Cairo'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-sand p-3">{listing.propertyType}</div>
              <div className="rounded-2xl bg-sand p-3">{listing.finishingLevel}</div>
              <div className="rounded-2xl bg-sand p-3">{listing.bedrooms} bedrooms</div>
              <div className="rounded-2xl bg-sand p-3">{listing.bathrooms} bathrooms</div>
              <div className="rounded-2xl bg-sand p-3">{listing.sizeSqm} sqm</div>
              <div className="rounded-2xl bg-sand p-3">{listing.daysListed} days listed</div>
            </div>

            <div className="rounded-2xl border border-ink/10 p-4 text-sm">
              <p>Seller type: {listing.seller.sellerType ?? 'Unknown'}</p>
              <p>Verified: {listing.seller.isVerified ? 'Yes' : 'No'}</p>
            </div>

            <ContactButtons listingId={listing.id} />
            <SaveButton listingId={listing.id} />
          </aside>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id;

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const listing = await getListingById(id);
    return { props: { listing } };
  } catch {
    return { notFound: true };
  }
};
