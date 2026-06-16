import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { destroyToken, getToken, saveToken } from '../api/jwt';
import type { AuthState } from '../types/auth';
import type { Errors } from '../types/errors';
import type { User } from '../types/user';

export interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: authApi.LoginCredentials) => Promise<User>;
  register: (credentials: authApi.RegisterCredentials) => Promise<User>;
  logout: () => void;
  updateUser: (user: authApi.UserUpdate) => Promise<User>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider — replaces Angular's `UserService`, the HTTP interceptors' 401
 * handling, and the app initializer.
 *
 * Auth states: 'loading' (checking stored token) → 'authenticated' |
 * 'unauthenticated' (no/invalid token, 4XX) | 'unavailable' (server 5XX/network,
 * token kept + auto-retry). The navbar always renders so the app never blanks out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  // Mirror latest values for the (synchronous) debug interface.
  const authStateRef = useRef(authState);
  const userRef = useRef(currentUser);
  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  // Auto-retry bookkeeping for the 'unavailable' state.
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

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

  // Schedule auto-retry with exponential backoff: 2s, 4s, 8s, 16s, 16s...
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
        void refreshRef.current();
      }
    }, delaySeconds * 1000);
  }, [cancelRetry]);

  const setUnavailable = useCallback(() => {
    setCurrentUser(null);
    setAuthState('unavailable');
    scheduleRetry();
  }, [scheduleRetry]);

  // 4XX → token is invalid → logout; otherwise (5XX/network/parse) → unavailable.
  const handleAuthError = useCallback(
    (err: unknown) => {
      const status = (err as Errors | undefined)?.status;
      if (typeof status === 'number' && status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setUnavailable();
      }
    },
    [purgeAuth, setUnavailable],
  );

  const refreshCurrentUser = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      setAuth(user);
    } catch (err) {
      handleAuthError(err);
    }
  }, [setAuth, handleAuthError]);

  useEffect(() => {
    refreshRef.current = refreshCurrentUser;
  }, [refreshCurrentUser]);

  const login = useCallback(
    async (credentials: authApi.LoginCredentials) => {
      const user = await authApi.login(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: authApi.RegisterCredentials) => {
      const user = await authApi.register(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  const updateUser = useCallback(async (user: authApi.UserUpdate) => {
    const updated = await authApi.updateUser(user);
    setCurrentUser(updated);
    return updated;
  }, []);

  // Expose the debug interface used by the e2e suite.
  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => userRef.current,
    };
  }, []);

  // App initialization: validate a stored token, or settle as unauthenticated.
  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);
    if (getToken()) {
      void refreshCurrentUser();
    } else {
      purgeAuth();
    }
    return () => cancelRetry();
    // Intentionally run once on mount.
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
      updateUser,
    }),
    [currentUser, authState, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
