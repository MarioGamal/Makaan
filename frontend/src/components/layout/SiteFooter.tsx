import Link from 'next/link';

import { translate } from '../../i18n';
import { useLocale } from './LocaleProvider';

export function SiteFooter() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const columns = [
    {
      title: t('shell.explore'),
      links: [
        { href: '/browse', label: t('navigation.browse') },
        { href: '/browse?purpose=sale', label: t('navigation.buy') },
        { href: '/browse?purpose=long_term_rent', label: t('navigation.rent') },
        { href: '/saved', label: t('navigation.saved') },
      ],
    },
    {
      title: t('shell.forSellers'),
      links: [{ href: '/auth/login', label: t('navigation.signIn') }],
    },
  ];

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2.5 font-display text-2xl font-medium text-ink">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-b-md rounded-t-full bg-brand-sheen text-sm font-semibold text-white"
            >
              م
            </span>
            {t('brand')}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-muted">
            {t('shell.footerDescription')}
          </p>
          <p className="mt-6 text-sm font-semibold text-primary">
            {t('shell.tagline')}
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-ink">{column.title}</p>
            <ul className="mt-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="inline-flex min-h-tap items-center text-sm text-ink-muted transition-colors hover:text-primary"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <p className="border-t border-border pt-6 text-sm text-ink-subtle md:col-span-3">
          {translate(locale, 'shell.copyright', {
            year: new Date().getFullYear(),
          })}
        </p>
      </div>
    </footer>
  );
}
