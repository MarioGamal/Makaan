import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { type Locale } from '../../i18n';
import { applyLocale, changeLocale, getClientLocale } from '../../utils/locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
};
const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale = 'ar',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    const selected = getClientLocale();
    setCurrentLocale(selected);
    applyLocale(selected);
  }, [initialLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: async (nextLocale) => {
        await changeLocale(router, nextLocale);
        setCurrentLocale(nextLocale);
      },
    }),
    [locale, router],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}
