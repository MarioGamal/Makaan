import type { PropsWithChildren } from 'react';
import { useRouter } from 'next/router';

import { translate } from '../../i18n';
import { AssistantWidget } from '../assistant/AssistantWidget';

import { useLocale } from './LocaleProvider';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const { locale } = useLocale();
  const isAdmin = router.pathname.startsWith('/admin');
  const isSellerJourney =
    router.pathname.startsWith('/seller') ||
    router.pathname.startsWith('/auth') ||
    router.pathname === '/listings/create' ||
    router.pathname === '/listings/submitted' ||
    router.pathname.endsWith('/edit');
  const showAssistant = !isAdmin && !isSellerJourney;
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {!isAdmin && (
        // Keyboard and screen-reader users skip the header and the hero
        // instead of tabbing through them on every page.
        <a
          className="sr-only z-50 focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:inline-flex focus:min-h-tap focus:items-center focus:rounded-pill focus:bg-primary focus:px-5 focus:text-sm focus:font-semibold focus:text-white"
          href="#main-content"
        >
          {translate(locale, 'common.skipToContent')}
        </a>
      )}
      {!isAdmin && <SiteHeader />}
      <div className="flex-1">{children}</div>
      {!isAdmin && <SiteFooter />}
      {/* Keep the discovery assistant off seller, authentication, and moderation workflows. */}
      {showAssistant && <AssistantWidget />}
    </div>
  );
}
