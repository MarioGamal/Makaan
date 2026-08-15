import { localeMeta, locales, translate } from '../../i18n';
import { useLocale } from './LocaleProvider';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const shortLabels = { ar: 'عربي', en: 'EN' } as const;

  return (
    <div
      aria-label={translate(locale, 'navigation.language')}
      className="relative grid min-h-11 min-w-[7.25rem] grid-cols-2 items-center rounded-full border border-ink/10 bg-white/80 p-1 shadow-sm backdrop-blur transition-shadow hover:shadow-ui"
      dir="ltr"
      role="group"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-sm transition-transform duration-300 ease-out ${
          locale === 'en' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {locales.map((item) => {
        const active = locale === item;
        return (
          <button
            aria-label={localeMeta[item].label}
            aria-pressed={active}
            className={`relative z-10 h-9 min-h-9 rounded-full px-3 text-xs font-semibold transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-oasis focus-visible:ring-offset-2 ${
              active ? 'text-white' : 'text-ink-muted hover:text-primary'
            }`}
            dir={localeMeta[item].direction}
            key={item}
            onClick={() => {
              if (!active) void setLocale(item);
            }}
            type="button"
          >
            {shortLabels[item]}
          </button>
        );
      })}
    </div>
  );
}
