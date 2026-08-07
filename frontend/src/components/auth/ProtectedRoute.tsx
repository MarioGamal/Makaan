import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../layout/LocaleProvider';
import { sellerCopy } from '../../i18n/seller';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocale();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      void router.replace(
        `/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`,
      );
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        {sellerCopy[locale].loading}
      </div>
    );
  }

  return <>{children}</>;
}
