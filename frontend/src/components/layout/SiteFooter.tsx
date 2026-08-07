import Link from 'next/link';
import { translate } from '../../i18n';
import { useLocale } from './LocaleProvider';

export function SiteFooter() {
  const { locale } = useLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="text-xl font-bold text-oasis">{t('brand')}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-ink/70">
            {t('shell.footerDescription')}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">{t('shell.explore')}</p>
          <Link
            className="mt-3 block min-h-11 py-2 text-sm text-ink/70 hover:text-oasis"
            href="/"
          >
            {t('navigation.browse')}
          </Link>
          <Link
            className="block min-h-11 py-2 text-sm text-ink/70 hover:text-oasis"
            href="/saved"
          >
            {t('navigation.saved')}
          </Link>
        </div>
        <div>
          <p className="text-sm font-semibold">{t('shell.forSellers')}</p>
          <Link
            className="mt-3 block min-h-11 py-2 text-sm text-ink/70 hover:text-oasis"
            href="/auth/login"
          >
            {t('navigation.signIn')}
          </Link>
        </div>
        <p className="text-sm text-ink/60 md:col-span-3">
          {translate(locale, 'shell.copyright', {
            year: new Date().getFullYear(),
          })}
        </p>
      </div>
    </footer>
  );
}
