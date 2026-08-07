import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isReady, user } = useAdminAuth();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'admin') {
      const returnUrl = encodeURIComponent(router.asPath);
      void router.replace(`/admin/login?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isReady, router, user]);

  if (!isReady || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-[2rem] border border-ink/10 bg-white p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-ink/50">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            Checking moderation access
          </h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
