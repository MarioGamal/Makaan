import Link from 'next/link';
import { useState } from 'react';

import { translate } from '../../i18n';
import { useLocale } from './LocaleProvider';
import { LocaleSwitcher } from './LocaleSwitcher';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const links = [
    { href: '/', label: t('navigation.browse') },
    { href: '/saved', label: t('navigation.saved') },
  ];

  return (
    <header className="border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          aria-label={t('brand')}
          className="text-2xl font-bold tracking-tight text-oasis"
          href="/"
        >
          {t('brand')}
        </Link>
        <nav
          aria-label={t('navigation.primaryNavigation')}
          className="hidden items-center gap-5 md:flex"
        >
          {links.map((link) => (
            <Link
              className="min-h-11 px-2 py-3 text-sm font-medium hover:text-oasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-oasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oasis"
            href="/auth/login"
          >
            {t('navigation.sell')}
          </Link>
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
            <Link
              className="min-h-11 rounded-xl bg-ink px-3 py-3 text-sm font-semibold text-white"
              href="/auth/login"
              onClick={() => setOpen(false)}
            >
              {t('navigation.sell')}
            </Link>
            <LocaleSwitcher />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
