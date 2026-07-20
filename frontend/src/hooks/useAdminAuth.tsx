import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ADMIN_STORAGE_KEY,
  type AdminUser,
  adminLogin,
  getStoredAdminAuth,
  logoutAdmin,
} from '../services/admin-auth.service';

type AdminAuthContextValue = {
  accessToken: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: {
    username: string;
    password: string;
    twoFactorCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = getStoredAdminAuth();
    if (stored) {
      setAccessToken(stored.accessToken);
      setUser(stored.user);
    }
    setIsReady(true);
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user?.role === 'admin'),
      isReady,
      login: async (credentials) => {
        const result = await adminLogin(credentials);
        setAccessToken(result.accessToken);
        setUser(result.user);
        window.localStorage.setItem(
          ADMIN_STORAGE_KEY,
          JSON.stringify({ accessToken: result.accessToken, user: result.user }),
        );
      },
      logout: async () => {
        await logoutAdmin();
        setAccessToken(null);
        setUser(null);
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
      },
    }),
    [accessToken, isReady, user],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
