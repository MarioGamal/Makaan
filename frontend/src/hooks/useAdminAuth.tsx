import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as service from '../services/admin-auth.service';
import { SessionError, type SessionStatus } from '../services/auth.service';
type AdminAuthContextValue = {
  user: service.AdminUser | null;
  csrfToken: string | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  isReady: boolean;
  isExpired: boolean;
  error: string | null;
  login: (credentials: {
    username: string;
    password: string;
    twoFactorCode: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<service.AdminUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setStatus('loading');
    setError(null);
    try {
      const session = await service.getAdminSession();
      setUser(session.admin);
      setCsrfToken(session.csrfToken);
      setStatus('authenticated');
    } catch (cause) {
      setUser(null);
      setCsrfToken(null);
      if (
        cause instanceof SessionError &&
        (cause.code === 'SESSION_EXPIRED' || cause.code === 'UNAUTHENTICATED')
      )
        setStatus('expired');
      else if (cause instanceof SessionError && cause.code === 'REQUEST_FAILED')
        setStatus('anonymous');
      else {
        setStatus('error');
        setError(
          cause instanceof Error ? cause.message : 'Unable to check session',
        );
      }
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      csrfToken,
      status,
      error,
      isAuthenticated: status === 'authenticated' && user?.role === 'admin',
      isReady: status !== 'loading',
      isExpired: status === 'expired',
      refresh,
      login: async (credentials) => {
        const session = await service.adminLogin(credentials);
        setUser(session.admin);
        setCsrfToken(session.csrfToken);
        setStatus('authenticated');
        setError(null);
      },
      logout: async () => {
        try {
          await service.logoutAdmin(csrfToken ?? undefined);
        } finally {
          setUser(null);
          setCsrfToken(null);
          setStatus('anonymous');
        }
      },
    }),
    [csrfToken, error, status, user],
  );
  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context)
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}
