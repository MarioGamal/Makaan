import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { ListingStatusCard } from '../../components/seller/ListingStatusCard';
import { AsyncState, Button, Card } from '../../components/ui';
import { useLocale } from '../../components/layout/LocaleProvider';
import { sellerCopy } from '../../i18n/seller';
import { useAuth } from '../../hooks/useAuth';
import {
  changeSellerListingStatus,
  getSellerListings,
  type SellerManagedListing,
} from '../../services/listings.service';

function Dashboard() {
  const { locale } = useLocale();
  const copy = sellerCopy[locale];
  const { user, csrfToken } = useAuth();
  const [items, setItems] = useState<SellerManagedListing[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(async () => {
    setState('loading');
    try {
      setItems((await getSellerListings()).items);
      setState('ready');
    } catch {
      setState('error');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async (
    listing: SellerManagedListing,
    action: 'withdraw' | 'mark-sold',
  ) => {
    if (
      !csrfToken ||
      !window.confirm(
        action === 'withdraw' ? copy.inactiveConfirm : copy.soldConfirm,
      )
    )
      return;
    try {
      const updated = await changeSellerListingStatus(
        listing.id,
        action,
        listing.lockVersion,
        csrfToken,
      );
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      /* item remains unchanged; card exposes no false success */
    }
  };
  const participation = user?.participation ?? 'owner_not_verified';
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-panel bg-primary p-6 text-white shadow-ui md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-primary-soft">
              {copy.dashboard}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{copy.manage}</h1>
            <p className="mt-3 max-w-xl text-sm text-white/80">
              {participation === 'declared_agent'
                ? copy.declaredAgent
                : `${copy.owner}${participation === 'verified_owner' ? ` · ${copy.verified}` : ''}`}
            </p>
          </div>
          <Link href="/listings/create">
            <Button className="bg-white text-primary hover:bg-surface-muted">
              {copy.new}
            </Button>
          </Link>
        </div>
      </section>
      <section className="mt-7">
        {state === 'loading' ? (
          <AsyncState state="loading" title={copy.loading} />
        ) : state === 'error' ? (
          <AsyncState
            state="error"
            title={copy.requestFailed}
            retryLabel={copy.next}
            onRetry={() => void load()}
          />
        ) : items.length === 0 ? (
          <Card className="py-12 text-center" padding="lg">
            <h2 className="text-xl font-bold">{copy.emptyTitle}</h2>
            <p className="mt-2 text-ink-muted">{copy.emptyText}</p>
            <Link className="mt-5 inline-block" href="/listings/create">
              <Button>{copy.new}</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <ListingStatusCard
                key={item.id}
                listing={item}
                onMarkInactive={() => void act(item, 'withdraw')}
                onMarkSold={() => void act(item, 'mark-sold')}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
export default function SellerDashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
