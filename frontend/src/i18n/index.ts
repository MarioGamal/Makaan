export {
  catalogues,
  finishingLevelLabel,
  localeMeta,
  locales,
  propertyTypeLabel,
  translate,
  type Locale,
  type TranslationKey,
} from './catalogues';

import { type Locale } from './catalogues';

export function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(
    value,
  );
}

export function formatDate(value: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
