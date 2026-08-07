import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service';

type AuthContextValue = {
  user: authService.SellerSessionUser | null;
  csrfToken: string | null;
  status: authService.SessionStatus;
  isAuthenticated: boolean;
  isReady: boolean;
  isExpired: boolean;
  error: string | null;
  login: (phone: string, code: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<authService.SellerSessionUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [status, setStatus] = useState<authService.SessionStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setStatus('loading');
    setError(null);
    try {
      const session = await authService.getSellerSession();
      setUser(session.user);
      setCsrfToken(session.csrfToken);
      setStatus('authenticated');
    } catch (cause) {
      setUser(null);
      setCsrfToken(null);
      if (
        cause instanceof authService.SessionError &&
        (cause.code === 'SESSION_EXPIRED' || cause.code === 'UNAUTHENTICATED')
      )
        setStatus('expired');
      else if (
        cause instanceof authService.SessionError &&
        cause.code === 'REQUEST_FAILED'
      )
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
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      csrfToken,
      status,
      error,
      isAuthenticated: status === 'authenticated',
      isReady: status !== 'loading',
      isExpired: status === 'expired',
      refresh,
      login: async (phone, code) => {
        const session = await authService.verifyOtp(phone, code);
        setUser(session.user);
        setCsrfToken(session.csrfToken);
        setStatus('authenticated');
        setError(null);
      },
      logout: async () => {
        try {
          await authService.logout(csrfToken ?? undefined);
        } finally {
          setUser(null);
          setCsrfToken(null);
          setStatus('anonymous');
        }
      },
    }),
    [csrfToken, error, status, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
