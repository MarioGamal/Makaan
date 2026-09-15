import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  applyTheme,
  DEFAULT_THEME_PREFERENCE,
  persistTheme,
  resolveTheme,
  systemTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../../utils/theme';

type ThemeContextValue = {
  /** What the visitor chose, including `system`. */
  preference: ThemePreference;
  /** What is actually painted right now. */
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  initialPreference = DEFAULT_THEME_PREFERENCE,
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialPreference);
  /*
   * Server-rendered markup cannot know the operating-system theme, so the
   * first render assumes light for `system` and the effect below corrects it
   * on mount. The paint itself is already correct: the pre-paint script in
   * `_document` set the class before React ran.
   */
  const [resolved, setResolved] = useState<ResolvedTheme>(
    initialPreference === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    setResolved(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = systemTheme();
      setResolved(next);
      applyTheme(next);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    persistTheme(next);
    const nextResolved = resolveTheme(next);
    applyTheme(nextResolved);
    setPreferenceState(next);
    setResolved(nextResolved);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
