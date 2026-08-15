import Link from 'next/link';
import { useState } from 'react';

import { translate } from '../../i18n';
import { SellerAccessDialog } from '../auth/SellerAccessDialog';
import { useLocale } from './LocaleProvider';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [sellerAccessOpen, setSellerAccessOpen] = useState(false);
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const links = [
    { href: '/browse', label: t('navigation.browse') },
    { href: '/browse?purpose=sale', label: t('navigation.buy') },
    { href: '/browse?purpose=long_term_rent', label: t('navigation.rent') },
    { href: '/saved', label: t('navigation.saved') },
  ];

  return (
    <header className="relative z-30 bg-canvas">
      <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          aria-label={t('brand')}
          className="inline-flex items-center gap-2 font-display text-2xl font-medium tracking-[-0.03em] text-ink"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-t-full rounded-b-md bg-primary text-xs text-white"
          >
            م
          </span>
          {t('brand')}
        </Link>
        <nav
          aria-label={t('navigation.primaryNavigation')}
          className="hidden items-center gap-7 md:flex"
        >
          {links.map((link) => (
            <Link
              className="min-h-11 px-2 py-3 text-sm font-semibold text-ink-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <button
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-oasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis"
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
          className="min-h-11 min-w-11 rounded-full border border-ink/15 text-lg md:hidden"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {open ? '×' : '☰'}
        </button>
      </div>
      {open ? (
        <nav
          aria-label={t('navigation.mobileNavigation')}
          className="border-t border-ink/10 bg-white px-4 py-3 md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <Link
                className="min-h-11 rounded-xl px-3 py-3 text-sm font-medium hover:bg-sand"
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              className="min-h-11 rounded-xl bg-ink px-3 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setOpen(false);
                setSellerAccessOpen(true);
              }}
              type="button"
            >
              {t('navigation.sell')}
            </button>
            <LocaleSwitcher />
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
