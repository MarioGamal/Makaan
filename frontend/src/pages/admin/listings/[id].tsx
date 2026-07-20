import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Marker } from 'react-map-gl';
import { z } from 'zod';

import { DuplicateHintsPanel } from '../../../components/admin/DuplicateHintsPanel';
import { AdminProtectedRoute } from '../../../components/auth/AdminProtectedRoute';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  approveAdminListing,
  getAdminListingById,
  rejectAdminListing,
  type AdminListingDetail,
} from '../../../services/admin-auth.service';

const Map = dynamic(
  async () => {
    const reactMapGl = await import('react-map-gl');
    return reactMapGl.default;
  },
  { ssr: false },
);

const rejectSchema = z.object({
  reason: z.enum([
    'incomplete_data',
    'inaccurate_location',
    'duplicate',
    'spam_scam',
  ]),
  notes: z.string().optional(),
});

export default function AdminListingReviewPage() {
  const router = useRouter();
  const listingId = typeof router.query.id === 'string' ? router.query.id : null;
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rejectForm = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: 'incomplete_data',
      notes: '',
    },
  });

  useEffect(() => {
    if (!listingId) {
      return;
    }

    const run = async () => {
      try {
        setIsLoading(true);
        const result = await getAdminListingById(listingId);
        setListing(result.listing);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : 'Unable to load listing review',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [listingId]);

  const handleApprove = async () => {
    if (!listingId || !window.confirm('Approve and publish this listing?')) {
      return;
    }

    try {
      await approveAdminListing(listingId);
      await router.push('/admin/queue');
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Unable to approve listing');
    }
  };

  const handleReject = rejectForm.handleSubmit(async (values) => {
    if (!listingId) {
      return;
    }

    try {
      await rejectAdminListing(listingId, values);
      await router.push('/admin/queue');
    } catch (rejectError) {
      rejectForm.setError('root', {
        message: rejectError instanceof Error ? rejectError.message : 'Unable to reject listing',
      });
    }
  });

  return (
    <AdminProtectedRoute>
      <AdminLayout pendingCount={undefined}>
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
            {isLoading ? (
              <p className="text-sm text-ink/60">Loading listing review...</p>
            ) : error ? (
              <p className="text-sm text-clay">{error}</p>
            ) : !listing ? (
              <p className="text-sm text-clay">Listing not found.</p>
            ) : (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Review</p>
                    <h1 className="mt-2 text-3xl font-semibold">
                      {listing.propertyType} in {listing.area.nameEn ?? 'Cairo'}
                    </h1>
                    <p className="mt-2 text-ink/70">
                      Submitted{' '}
                      {listing.submittedAt
                        ? new Date(listing.submittedAt).toLocaleString()
                        : 'recently'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-full bg-[#1a7f5a] px-5 py-3 text-sm font-semibold text-white"
                      onClick={() => void handleApprove()}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-full bg-[#a63c35] px-5 py-3 text-sm font-semibold text-white"
                      onClick={() => setIsRejectOpen(true)}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                  <div className="space-y-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {listing.photos.map((photo) => (
                        <img
                          alt={`Listing photo ${photo.order + 1}`}
                          className="h-48 w-full rounded-[1.5rem] object-cover"
                          key={photo.id}
                          src={photo.url}
                        />
                      ))}
                    </div>
                    <div className="grid gap-4 rounded-[2rem] bg-sand/40 p-6 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Price</p>
                        <p className="mt-2 text-lg font-semibold">
                          EGP {listing.priceEgp.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Specs</p>
                        <p className="mt-2 text-lg font-semibold">
                          {listing.bedrooms} bd · {listing.bathrooms} ba
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Area</p>
                        <p className="mt-2 text-lg font-semibold">{listing.sizeSqm} sqm</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
                          Finishing
                        </p>
                        <p className="mt-2 text-lg font-semibold">{listing.finishingLevel}</p>
                      </div>
                    </div>
                    <article className="rounded-[2rem] border border-ink/10 p-6">
                      <h2 className="text-xl font-semibold">Description</h2>
                      <p className="mt-3 whitespace-pre-wrap text-ink/75">
                        {listing.description || 'No description provided.'}
                      </p>
                    </article>
                  </div>
                  <div className="space-y-6">
                    <article className="rounded-[2rem] border border-ink/10 p-6">
                      <h2 className="text-xl font-semibold">Seller</h2>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-ink/50">Phone</dt>
                          <dd>{listing.seller.phone}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-ink/50">Type</dt>
                          <dd>{listing.seller.sellerType ?? 'seller'}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-ink/50">Verified</dt>
                          <dd>{listing.seller.isVerified ? 'Yes' : 'No'}</dd>
                        </div>
                      </dl>
                    </article>
                    <article className="overflow-hidden rounded-[2rem] border border-ink/10">
                      <div className="h-[280px]">
                        <Map
                          initialViewState={{
                            latitude: listing.location.lat,
                            longitude: listing.location.lng,
                            zoom: 13,
                          }}
                          mapStyle="mapbox://styles/mapbox/streets-v12"
                          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''}
                          maxPitch={0}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <Marker
                            anchor="bottom"
                            latitude={listing.location.lat}
                            longitude={listing.location.lng}
                          >
                            <div className="rounded-full bg-clay px-3 py-2 text-xs font-semibold text-white">
                              PIN
                            </div>
                          </Marker>
                        </Map>
                      </div>
                    </article>
                    <DuplicateHintsPanel hints={listing.duplicateHints} />
                  </div>
                </div>
              </>
            )}
          </section>

          {isRejectOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4">
              <form
                className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"
                onSubmit={handleReject}
              >
                <h2 className="text-2xl font-semibold">Reject listing</h2>
                <p className="mt-2 text-sm text-ink/70">
                  Pick one of the predefined rejection reasons and optionally add notes.
                </p>
                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-medium">Reason</span>
                  <select
                    className="w-full rounded-2xl border border-ink/10 px-4 py-3"
                    {...rejectForm.register('reason')}
                  >
                    <option value="incomplete_data">Incomplete data</option>
                    <option value="inaccurate_location">Inaccurate location</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="spam_scam">Spam / scam</option>
                  </select>
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium">Notes</span>
                  <textarea
                    className="min-h-32 w-full rounded-2xl border border-ink/10 px-4 py-3"
                    {...rejectForm.register('notes')}
                  />
                </label>
                <p className="mt-3 text-sm text-clay">{rejectForm.formState.errors.root?.message}</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold"
                    onClick={() => setIsRejectOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-full bg-[#a63c35] px-4 py-3 text-sm font-semibold text-white"
                    type="submit"
                  >
                    Confirm rejection
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
