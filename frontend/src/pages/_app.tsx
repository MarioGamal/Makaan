import NextApp, { type AppContext, type AppProps } from 'next/app';
import { SWRConfig } from 'swr';

import { AdminAuthProvider } from '../hooks/useAdminAuth';
import { AuthProvider } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { LocaleProvider } from '../components/layout/LocaleProvider';
import { localeFromCookie } from '../utils/locale';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/globals.css';

type MakaanAppProps = AppProps & {
  pageProps: AppProps['pageProps'] & { initialLocale?: 'ar' | 'en' };
};

export default function App({ Component, pageProps }: MakaanAppProps) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        revalidateOnFocus: false,
      }}
    >
      <AdminAuthProvider>
        <AuthProvider>
          <LocaleProvider initialLocale={pageProps.initialLocale}>
            <AppShell>
              <Component {...pageProps} />
            </AppShell>
          </LocaleProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </SWRConfig>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const initialProps = await NextApp.getInitialProps(appContext);
  return {
    ...initialProps,
    pageProps: {
      ...initialProps.pageProps,
      initialLocale: localeFromCookie(appContext.ctx.req?.headers.cookie),
    },
  };
};
