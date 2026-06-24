import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { User } from '../types';
import * as api from '../api';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

interface AuthContextValue {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const setAuth = useCallback(
    (u: User) => {
      cancelRetry();
      retryAttemptRef.current = 0;
      api.jwt.saveToken(u.token);
      setUser(u);
      setAuthState('authenticated');
    },
    [cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttemptRef.current = 0;
    api.jwt.destroyToken();
    setUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry]);

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!api.jwt.getToken()) return;

    const delaySeconds = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16);
    retryAttemptRef.current++;

    retryTimerRef.current = setTimeout(async () => {
      if (!api.jwt.getToken()) return;
      setAuthState('loading');
      try {
        const u = await api.getCurrentUser();
        setAuth(u);
      } catch (err: unknown) {
        const status = (err as { status?: number }).status ?? 0;
        if (status >= 400 && status < 500) {
          purgeAuth();
        } else {
          setUser(null);
          setAuthState('unavailable');
          scheduleRetry();
        }
      }
    }, delaySeconds * 1000);
  }, [cancelRetry, setAuth, purgeAuth]);

  useEffect(() => {
    const token = api.jwt.getToken();
    if (!token) {
      purgeAuth();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const u = await api.getCurrentUser();
        if (!cancelled) setAuth(u);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { status?: number }).status ?? 0;
        if (status >= 400 && status < 500) {
          purgeAuth();
        } else {
          setUser(null);
          setAuthState('unavailable');
          scheduleRetry();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => api.jwt.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => user,
    };
  }, [authState, user]);

  const loginFn = useCallback(
    async (credentials: { email: string; password: string }) => {
      const u = await api.login(credentials);
      setAuth(u);
      return u;
    },
    [setAuth],
  );

  const registerFn = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const u = await api.register(credentials);
      setAuth(u);
      return u;
    },
    [setAuth],
  );

  const logoutFn = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  const updateUserFn = useCallback(async (userData: Partial<User>) => {
    const u = await api.updateUser(userData);
    setUser(u);
    return u;
  }, []);

  const value: AuthContextValue = {
    user,
    authState,
    isAuthenticated: authState === 'authenticated',
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
    updateUser: updateUserFn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
