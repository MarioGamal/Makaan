import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { translate } from '../../i18n';
import { SellerAccessDialog } from '../auth/SellerAccessDialog';
import { CloseIcon, HeartIcon, MenuIcon } from '../ui/icons';

import { useLocale } from './LocaleProvider';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sellerAccessOpen, setSellerAccessOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  /*
   * The header is transparent at the top of the page so the hero reads as
   * full-bleed, and turns into a glass bar once anything has scrolled under it.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A route change leaves the mobile sheet open otherwise.
  useEffect(() => setOpen(false), [router.asPath]);

  const links = [
    { href: '/browse', label: t('navigation.browse') },
    { href: '/browse?purpose=sale', label: t('navigation.buy') },
    { href: '/browse?purpose=long_term_rent', label: t('navigation.rent') },
  ];
  const isActive = (href: string) =>
    href.startsWith('/browse') && router.pathname === '/browse'
      ? router.asPath === href
      : router.pathname === href;

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ease-soft ${
        scrolled
          ? 'glass border-x-0 border-t-0 shadow-ui'
          : 'border-b border-transparent bg-canvas'
      }`}
      data-testid="site-header"
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-content items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          aria-label={t('brand')}
          className="inline-flex min-h-tap items-center gap-2.5 rounded-pill font-display text-2xl font-medium tracking-[-0.03em] text-ink"
          data-testid="brand-home-link"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-b-md rounded-t-full bg-brand-sheen text-sm font-semibold text-white shadow-glow"
          >
            م
          </span>
          {t('brand')}
        </Link>

        <nav
          aria-label={t('navigation.primaryNavigation')}
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((link) => (
            <Link
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`inline-flex min-h-tap items-center rounded-pill px-3.5 text-sm font-semibold transition-colors duration-200 ${
                isActive(link.href)
                  ? 'bg-primary-soft text-primary'
                  : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            aria-label={t('navigation.saved')}
            className="grid size-tap place-items-center rounded-pill text-ink-muted transition-colors duration-200 hover:bg-surface-muted hover:text-primary"
            data-testid="saved-link"
            href="/saved"
          >
            <HeartIcon className="size-5" />
          </Link>
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            className="inline-flex min-h-tap items-center rounded-pill bg-primary px-5 text-sm font-semibold text-white shadow-ui transition-all duration-200 ease-soft hover:bg-primary-strong hover:shadow-panel active:translate-y-px"
            data-testid="sell-cta"
            onClick={() => setSellerAccessOpen(true)}
            type="button"
          >
            {t('navigation.sell')}
          </button>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={open}
          aria-label={
            open ? t('navigation.closeMenu') : t('navigation.openMenu')
          }
          className="grid size-tap place-items-center rounded-pill border border-border bg-surface-raised text-ink transition-colors duration-200 hover:bg-surface-muted md:hidden"
          data-testid="menu-toggle"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? (
            <CloseIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </button>
      </div>

      {open ? (
        <nav
          aria-label={t('navigation.mobileNavigation')}
          className="animate-fade-up border-t border-border bg-surface px-4 py-3 md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto flex max-w-content flex-col gap-1">
            {[...links, { href: '/saved', label: t('navigation.saved') }].map(
              (link) => (
                <Link
                  className="min-h-12 rounded-ui px-3 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-muted"
                  href={link.href}
                  key={link.href}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ),
            )}
            <button
              className="mt-1 min-h-12 rounded-ui bg-primary px-3 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setOpen(false);
                setSellerAccessOpen(true);
              }}
              type="button"
            >
              {t('navigation.sell')}
            </button>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>
      ) : null}

      <SellerAccessDialog
        onClose={() => setSellerAccessOpen(false)}
        open={sellerAccessOpen}
      />
    </header>
  );
}
