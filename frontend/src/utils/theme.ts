/**
 * Theme preference.
 *
 * The preference is stored in a cookie rather than localStorage because the
 * server renders the document: a cookie is readable in `getInitialProps`, so
 * a chosen theme is already on `<html>` in the first byte of HTML and the page
 * never flashes the other theme before hydration.
 *
 * `system` keeps following the operating system, which the server cannot know.
 * That single case is resolved by the pre-paint script in `_document`.
 */
export const THEME_COOKIE = 'makaan_theme';

export const themePreferences = ['light', 'dark', 'system'] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = 'light' | 'dark';

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    (themePreferences as readonly string[]).includes(value)
  );
}

export function themeFromCookie(cookieHeader?: string): ThemePreference {
  const value = cookieHeader
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === THEME_COOKIE)?.[1];
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

export function persistTheme(preference: ThemePreference) {
  document.cookie = `${THEME_COOKIE}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = resolved;
}

/**
 * Runs before first paint, inlined in the document head. It only has to cover
 * the `system` preference and a cookie written in another tab; an explicit
 * preference is already applied server-side. Kept dependency-free and small
 * because it is render-blocking by design.
 */
export const themeBootstrapScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);var p=m?m[1]:'${DEFAULT_THEME_PREFERENCE}';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
