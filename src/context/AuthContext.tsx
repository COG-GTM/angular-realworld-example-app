import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../models/user.model';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ user: User }>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<{ user: User }>;
  logout: () => void;
  update: (userData: Partial<User>) => Promise<{ user: User }>;
  setAuth: (user: User) => void;
  purgeAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

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
  const navigate = useNavigate();
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const setAuth = useCallback(
    (u: User) => {
      cancelRetry();
      retryAttempt.current = 0;
      api.saveToken(u.token);
      setUser(u);
      setAuthState('authenticated');
    },
    [cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    api.destroyToken();
    setUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry]);

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!api.getToken()) return;
    const delay = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
    retryAttempt.current++;
    retryTimer.current = setTimeout(async () => {
      if (!api.getToken()) return;
      setAuthState('loading');
      try {
        const data = await api.get<{ user: User }>('/user');
        setAuth(data.user);
      } catch (err: unknown) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        if (status >= 400 && status < 500) {
          purgeAuth();
        } else {
          setUser(null);
          setAuthState('unavailable');
          scheduleRetry();
        }
      }
    }, delay * 1000);
  }, [cancelRetry, setAuth, purgeAuth]);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => api.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => user,
    };
  }, [authState, user]);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      purgeAuth();
      return;
    }
    api
      .get<{ user: User }>('/user')
      .then(data => setAuth(data.user))
      .catch((err: unknown) => {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        if (status >= 400 && status < 500) {
          purgeAuth();
        } else {
          setUser(null);
          setAuthState('unavailable');
          scheduleRetry();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const data = await api.post<{ user: User }>('/users/login', {
        user: credentials,
      });
      setAuth(data.user);
      return data;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const data = await api.post<{ user: User }>('/users', {
        user: credentials,
      });
      setAuth(data.user);
      return data;
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
    navigate('/');
  }, [purgeAuth, navigate]);

  const update = useCallback(async (userData: Partial<User>) => {
    const data = await api.put<{ user: User }>('/user', { user: userData });
    setUser(data.user);
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        update,
        setAuth,
        purgeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
