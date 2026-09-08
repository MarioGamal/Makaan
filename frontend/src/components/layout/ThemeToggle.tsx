import { translate } from '../../i18n';
import { themePreferences, type ThemePreference } from '../../utils/theme';
import { AutoThemeIcon, MoonIcon, SunIcon } from '../ui/icons';

import { useLocale } from './LocaleProvider';
import { useTheme } from './ThemeProvider';

const icons = {
  light: SunIcon,
  dark: MoonIcon,
  system: AutoThemeIcon,
} as const;

const labelKeys = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
} as const;

/**
 * Three states, not two: `system` has to stay reachable, otherwise a visitor
 * who lands here at night is locked to whichever theme they last tapped.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { locale } = useLocale();
  const { preference, setPreference } = useTheme();

  return (
    <div
      aria-label={translate(locale, 'theme.label')}
      className={`inline-grid grid-cols-3 items-center gap-0.5 rounded-pill border border-border bg-surface/70 p-1 ${className}`}
      data-testid="theme-toggle"
      dir="ltr"
      role="group"
    >
      {themePreferences.map((option: ThemePreference) => {
        const OptionIcon = icons[option];
        const active = preference === option;
        return (
          <button
            aria-label={translate(locale, labelKeys[option])}
            aria-pressed={active}
            className={`grid size-tap place-items-center rounded-full transition-colors duration-200 ${
              active
                ? 'bg-primary text-white shadow-ui'
                : 'text-ink-muted hover:bg-surface-muted hover:text-primary'
            }`}
            data-testid={`theme-option-${option}`}
            key={option}
            onClick={() => setPreference(option)}
            title={translate(locale, labelKeys[option])}
            type="button"
          >
            <OptionIcon className="size-[1.15rem]" />
          </button>
        );
      })}
    </div>
  );
}
