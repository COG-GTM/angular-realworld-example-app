import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthStatus, User } from '../types';
import { AuthAPI } from '../api/agent';
import { destroyToken, getToken, saveToken } from '../api/token';
import type { NormalizedError } from '../api/client';

/**
 * AuthProvider replaces Angular's `UserService`. It manages:
 * - currentUser + authStatus ('loading' | 'authenticated' | 'unauthenticated' | 'unavailable')
 * - login / register / logout / updateUser
 * - startup auth check (validate stored token via GET /user)
 * - 4XX vs 5XX handling on GET /user (logout vs. retry with exponential backoff)
 * - global 401 logout (via the `conduit:unauthorized` event from the axios client)
 * - the `window.__conduit_debug__` interface used by the e2e suite
 */
interface AuthContextValue {
  currentUser: User | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  updateUser: (user: Partial<User>) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setAuthStatus('authenticated');
    },
    [cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    destroyToken();
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
  }, [cancelRetry]);

  // Validate the stored token. 4XX -> logout, 5XX/network -> retry with backoff.
  const fetchCurrentUser = useCallback(() => {
    AuthAPI.current()
      .then(user => setAuth(user))
      .catch((err: NormalizedError) => {
        const status = err.status;
        if (status >= 400 && status < 500) {
          purgeAuth();
        } else {
          setCurrentUser(null);
          setAuthStatus('unavailable');
          scheduleRetry();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAuth, purgeAuth]);

  // Exponential backoff: 2s, 4s, 8s, 16s, 16s... (capped at 16s).
  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!getToken()) return;
    const delaySeconds = Math.min(2 ** (retryAttempt.current + 1), 16);
    retryAttempt.current += 1;
    retryTimer.current = setTimeout(() => fetchCurrentUser(), delaySeconds * 1000);
  }, [cancelRetry, fetchCurrentUser]);

  const login = useCallback(
    (credentials: { email: string; password: string }) =>
      AuthAPI.login(credentials).then(user => {
        setAuth(user);
        return user;
      }),
    [setAuth],
  );

  const register = useCallback(
    (credentials: { username: string; email: string; password: string }) =>
      AuthAPI.register(credentials).then(user => {
        setAuth(user);
        return user;
      }),
    [setAuth],
  );

  const updateUser = useCallback(
    (user: Partial<User>) =>
      AuthAPI.update(user).then(updated => {
        setAuth(updated);
        return updated;
      }),
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  // Startup auth check.
  useEffect(() => {
    if (getToken()) {
      fetchCurrentUser();
    } else {
      purgeAuth();
    }
    return () => cancelRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global 401 handling dispatched by the axios response interceptor.
  useEffect(() => {
    const handler = () => purgeAuth();
    window.addEventListener('conduit:unauthorized', handler);
    return () => window.removeEventListener('conduit:unauthorized', handler);
  }, [purgeAuth]);

  // Debug interface used by the e2e suite (mirrors Angular's setupDebugInterface).
  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => authStatus,
      getCurrentUser: () => currentUser,
    };
  }, [authStatus, currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      authStatus,
      isAuthenticated: !!currentUser,
      login,
      register,
      updateUser,
      logout,
    }),
    [currentUser, authStatus, login, register, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => AuthStatus;
      getCurrentUser: () => User | null;
    };
  }
}
