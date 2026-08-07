import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/router';

import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');
  return (
    <div className="flex min-h-screen flex-col text-ink">
      {!isAdmin && <SiteHeader />}
      <div className="flex-1">{children}</div>
      {!isAdmin && <SiteFooter />}
    </div>
  );
}
