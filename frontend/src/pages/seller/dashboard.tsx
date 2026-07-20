import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ListingStatusCard } from '../../components/seller/ListingStatusCard';
import { useAuth } from '../../hooks/useAuth';
import {
  getSellerListings,
  getSellerNotifications,
  updateSellerListingStatus,
  type SellerManagedListing,
  type SellerNotification,
} from '../../services/listings.service';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<SellerManagedListing[]>([]);
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [sellerProfile, setSellerProfile] = useState<{ sellerType: 'owner' | 'agent'; isVerified: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [sellerListings, sellerNotifications] = await Promise.all([
          getSellerListings(),
          getSellerNotifications(),
        ]);
        setListings(sellerListings.listings);
        setSellerProfile(sellerListings.seller);
        setNotifications(sellerNotifications.notifications);
      } catch (fetchError) {
        const payload = fetchError as { message?: string };
        setError(payload.message ?? 'Unable to load your dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleStatusChange = async (listingId: string, status: 'sold' | 'inactive') => {
    const prompt =
      status === 'sold'
        ? 'Mark this listing as sold and remove it from the buyer map?'
        : 'Mark this listing as inactive and remove it from the buyer map?';

    if (!window.confirm(prompt)) {
      return;
    }

    await updateSellerListingStatus(listingId, status);
    setListings((current) =>
      current.map((listing) =>
        listing.id === listingId ? { ...listing, status } : listing,
      ),
    );
  };

  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Seller dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold">Manage your listings</h1>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-ink/70">
                  <span className="rounded-full bg-sand px-3 py-1">
                    {(sellerProfile?.sellerType ?? user?.sellerType ?? 'owner').toUpperCase()}
                  </span>
                  {sellerProfile?.isVerified ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
                      Verified seller
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                className="inline-flex rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                href="/listings/create"
              >
                Create New Listing
              </Link>
            </div>
          </section>

          {notifications.length > 0 ? (
            <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm">
              <h2 className="text-xl font-semibold">Recent moderation feedback</h2>
              <div className="mt-4 space-y-3">
                {notifications.map((notification) => (
                  <div className="rounded-[1.5rem] bg-white/70 p-4" key={notification.id}>
                    <p className="font-semibold">
                      {notification.listingTitle}: {notification.rejectionReason.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-1 text-sm">
                      {notification.notes ?? 'Open the listing, update it, and resubmit for review.'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isLoading ? (
            <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
              <p className="text-sm text-ink/60">Loading your listings...</p>
            </section>
          ) : error ? (
            <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <p className="text-sm text-rose-900">{error}</p>
            </section>
          ) : listings.length === 0 ? (
            <section className="rounded-[2rem] border border-ink/10 bg-white p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold">No listings yet</h2>
              <p className="mt-2 text-ink/70">Create your first listing to start reaching buyers.</p>
            </section>
          ) : (
            <section className="space-y-5">
              {listings.map((listing) => (
                <ListingStatusCard
                  key={listing.id}
                  listing={listing}
                  onMarkInactive={(listingId) => void handleStatusChange(listingId, 'inactive')}
                  onMarkSold={(listingId) => void handleStatusChange(listingId, 'sold')}
                />
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
