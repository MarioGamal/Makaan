import { localeMeta, locales, translate } from '../../i18n';
import { useLocale } from './LocaleProvider';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink">
      <span className="sr-only">{translate(locale, 'navigation.language')}</span>
      <select
        aria-label={translate(locale, 'navigation.language')}
        className="min-h-11 rounded-full border border-ink/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-oasis"
        onChange={(event) =>
          void setLocale(event.target.value as typeof locale)
        }
        value={locale}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {localeMeta[item].label}
          </option>
        ))}
      </select>
    </label>
  );
}
