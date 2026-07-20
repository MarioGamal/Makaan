import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      void router.replace(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm">
        Loading your seller session...
      </div>
    );
  }

  return <>{children}</>;
}

