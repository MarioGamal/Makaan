import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { useLocale } from '../../../components/layout/LocaleProvider';
import { SellerListingEditor } from '../../../components/seller/SellerListingEditor';
import { AsyncState } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import {
  getSellerListing,
  type SellerManagedListing,
} from '../../../services/listings.service';
import { sellerCopy } from '../../../i18n/seller';
export default function ListingEditPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = sellerCopy[locale];
  const { csrfToken } = useAuth();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const [listing, setListing] = useState<SellerManagedListing | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!id) return;
    void getSellerListing(id)
      .then(setListing)
      .catch(() => setError(true));
  }, [id]);
  return (
    <ProtectedRoute>
      {error ? (
        <AsyncState state="error" title={copy.requestFailed} />
      ) : listing && csrfToken ? (
        <SellerListingEditor listing={listing} csrfToken={csrfToken} />
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-8">
          <AsyncState state="loading" title={copy.loading} />
        </main>
      )}
    </ProtectedRoute>
  );
}
