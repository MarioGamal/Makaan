import { localeMeta, locales, translate } from '../../i18n';
import { useLocale } from './LocaleProvider';

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const shortLabels = { ar: 'عربي', en: 'EN' } as const;

  return (
    <div
      aria-label={translate(locale, 'navigation.language')}
      className="relative grid min-h-tap min-w-[7rem] grid-cols-2 items-center rounded-pill border border-border bg-surface/70 p-1"
      data-testid="locale-switcher"
      // The control keeps a fixed left-to-right order so the moving pill does
      // not jump sides when the interface direction flips.
      dir="ltr"
      role="group"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-pill bg-primary shadow-ui transition-transform duration-300 ease-spring ${
          locale === 'en' ? 'translate-x-full' : 'translate-x-0'
        }`}
      />
      {locales.map((item) => {
        const active = locale === item;
        return (
          <button
            aria-label={localeMeta[item].label}
            aria-pressed={active}
            className={`relative z-10 min-h-tap rounded-pill px-3 text-xs font-semibold transition-colors duration-300 ${
              active ? 'text-white' : 'text-ink-muted hover:text-primary'
            }`}
            data-testid={`locale-option-${item}`}
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
