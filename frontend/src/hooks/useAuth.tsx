import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authService from '../services/auth.service';

type AuthUser = Awaited<ReturnType<typeof authService.verifyOtp>>['user'];

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'makaan_auth_user';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored) as AuthUser);
    }
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      login: async (phone: string, code: string) => {
        const result = await authService.verifyOtp(phone, code);
        setUser(result.user);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
      },
      logout: async () => {
        await authService.logout();
        setUser(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

