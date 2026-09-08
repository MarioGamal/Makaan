import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/router';

import { AssistantWidget } from '../assistant/AssistantWidget';

import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');
  const isSellerJourney =
    router.pathname.startsWith('/seller') ||
    router.pathname.startsWith('/auth') ||
    router.pathname === '/listings/create' ||
    router.pathname === '/listings/submitted' ||
    router.pathname.endsWith('/edit');
  const showAssistant = !isAdmin && !isSellerJourney;
  return (
    <div className="flex min-h-screen flex-col text-ink">
      {!isAdmin && <SiteHeader />}
      <div className="flex-1">{children}</div>
      {!isAdmin && <SiteFooter />}
      {/* Keep the discovery assistant off seller, authentication, and moderation workflows. */}
      {showAssistant && <AssistantWidget />}
    </div>
  );
}
