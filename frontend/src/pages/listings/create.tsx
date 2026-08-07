import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { SellerListingEditor } from '../../components/seller/SellerListingEditor';
import { useAuth } from '../../hooks/useAuth';
export default function ListingCreatePage() {
  const { csrfToken, refresh } = useAuth();
  return (
    <ProtectedRoute>
      {csrfToken ? (
        <SellerListingEditor csrfToken={csrfToken} onSessionChange={refresh} />
      ) : null}
    </ProtectedRoute>
  );
}
