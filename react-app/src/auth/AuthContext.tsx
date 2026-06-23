import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { api, ApiError, setUnauthorizedHandler } from '../api/client';
import { destroyToken, getToken, saveToken } from './jwt';
import { AuthState, User } from '../types';

/**
 * AuthContext - React port of Angular's UserService.
 *
 * Auth states:
 * - 'loading': checking if a stored token is valid
 * - 'authenticated': token valid, user loaded
 * - 'unauthenticated': no token or token invalid (4XX)
 * - 'unavailable': server error (5XX/network), token kept, auto-retry with backoff
 *
 * On GET /user errors, 4XX clears the token (logout), while 5XX/network keeps it
 * and retries with exponential backoff (2s, 4s, 8s, 16s, capped at 16s).
 */
interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  update: (user: Partial<User> & { password?: string }) => Promise<User>;
  getCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync so the debug interface always reads the latest values.
  const userRef = useRef<User | null>(null);
  const stateRef = useRef<AuthState>('loading');
  userRef.current = currentUser;
  stateRef.current = authState;

  const cancelRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const setAuth = useCallback(
    (user: User) => {
      cancelRetry();
      retryAttempt.current = 0;
      saveToken(user.token);
      setCurrentUser(user);
      setAuthState('authenticated');
    },
    [cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    destroyToken();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry]);

  const getCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const { user } = await api.get<{ user: User }>('/user');
      setAuth(user);
    } catch (err) {
      const status = (err as ApiError).status;
      if (status >= 400 && status < 500) {
        purgeAuth();
      } else {
        // 5XX or network error: keep the token, enter "unavailable" and schedule a retry.
        setCurrentUser(null);
        setAuthState('unavailable');
        scheduleRetry();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAuth, purgeAuth]);

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
    retryAttempt.current += 1;
    retryTimer.current = setTimeout(() => {
      if (getToken()) {
        setAuthState('loading');
        void getCurrentUser();
      }
    }, delaySeconds * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelRetry]);

  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<User> => {
      const { user } = await api.post<{ user: User }>('/users/login', { user: credentials });
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }): Promise<User> => {
      const { user } = await api.post<{ user: User }>('/users', { user: credentials });
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const update = useCallback(async (user: Partial<User> & { password?: string }): Promise<User> => {
    const { user: updated } = await api.put<{ user: User }>('/user', { user });
    setCurrentUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  // Global 401 handler for endpoints other than /user (token expired mid-session).
  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);
  }, [purgeAuth]);

  // App initializer: validate a stored token at startup, else go unauthenticated.
  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => stateRef.current,
      getCurrentUser: () => userRef.current,
    };

    if (getToken()) {
      void getCurrentUser();
    } else {
      purgeAuth();
    }

    return () => cancelRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      authState,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
      update,
      getCurrentUser,
    }),
    [currentUser, authState, login, register, logout, update, getCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
