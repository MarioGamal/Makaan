import type { NextRouter } from 'next/router';

import { localeMeta, locales, type Locale } from '../i18n';

export const LOCALE_COOKIE = 'makaan_locale';
export const DEFAULT_LOCALE: Locale = 'ar';

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (locales as readonly string[]).includes(value)
  );
}

export function localeFromCookie(cookieHeader?: string): Locale {
  const value = cookieHeader
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([key]) => key === LOCALE_COOKIE)?.[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getClientLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  return localeFromCookie(document.cookie);
}

export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeMeta[locale].direction;
}

/** Preserves the complete Next route, including dynamic pathname and query string. */
export async function changeLocale(router: NextRouter, locale: Locale) {
  persistLocale(locale);
  applyLocale(locale);
  await router.replace(router.asPath, undefined, { scroll: false });
}
