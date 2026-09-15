import NextApp, { type AppContext, type AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/next';
import { SWRConfig } from 'swr';

import { AdminAuthProvider } from '../hooks/useAdminAuth';
import { AuthProvider } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { LocaleProvider } from '../components/layout/LocaleProvider';
import { ThemeProvider } from '../components/layout/ThemeProvider';
import { localeFromCookie } from '../utils/locale';
import { themeFromCookie, type ThemePreference } from '../utils/theme';
import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/globals.css';

type MakaanAppProps = AppProps & {
  pageProps: AppProps['pageProps'] & {
    initialLocale?: 'ar' | 'en';
    initialTheme?: ThemePreference;
  };
};

export default function App({ Component, pageProps }: MakaanAppProps) {
  return (
    <>
      <SWRConfig
        value={{
          dedupingInterval: 2000,
          revalidateOnFocus: false,
          // A map drag or a filter change should reuse what is already
          // rendered rather than blanking the grid on every keystroke.
          keepPreviousData: true,
        }}
      >
        <AdminAuthProvider>
          <AuthProvider>
            <ThemeProvider initialPreference={pageProps.initialTheme}>
              <LocaleProvider initialLocale={pageProps.initialLocale}>
                <AppShell>
                  <Component {...pageProps} />
                </AppShell>
              </LocaleProvider>
            </ThemeProvider>
          </AuthProvider>
        </AdminAuthProvider>
      </SWRConfig>
      <Analytics />
    </>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const initialProps = await NextApp.getInitialProps(appContext);
  const cookie = appContext.ctx.req?.headers.cookie;
  return {
    ...initialProps,
    pageProps: {
      ...initialProps.pageProps,
      initialLocale: localeFromCookie(cookie),
      initialTheme: themeFromCookie(cookie),
    },
  };
};
