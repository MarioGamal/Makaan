import type { AppProps } from 'next/app';
import { SWRConfig } from 'swr';

import { AdminAuthProvider } from '../hooks/useAdminAuth';
import { AuthProvider } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000,
        revalidateOnFocus: false,
      }}
    >
      <AdminAuthProvider>
        <AuthProvider>
          <AppShell>
            <Component {...pageProps} />
          </AppShell>
        </AuthProvider>
      </AdminAuthProvider>
    </SWRConfig>
  );
}
