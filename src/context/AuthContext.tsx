import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { jwtService } from '../api/jwt';
import { apiClient, setUnauthorizedHandler } from '../api/apiClient';

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

interface Credentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends Credentials {
  username: string;
}

type UpdateUserInput = Partial<User> & { password?: string };

interface AuthContextValue {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: UpdateUserInput) => Promise<User>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Manages authentication state for the current user.
 *
 * Auth states:
 * - 'loading': checking whether a stored token is valid
 * - 'authenticated': token valid, user loaded
 * - 'unauthenticated': no token or token invalid (4XX)
 * - 'unavailable': server error (5XX/network), token kept, auto-retry with backoff
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  const userRef = useRef<User | null>(null);
  const authStateRef = useRef<AuthState>('loading');
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyUser = useCallback((value: User | null) => {
    userRef.current = value;
    setUser(value);
  }, []);

  const applyState = useCallback((value: AuthState) => {
    authStateRef.current = value;
    setAuthState(value);
  }, []);

  const cancelRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const setAuth = useCallback(
    (value: User) => {
      cancelRetry();
      retryAttempt.current = 0;
      jwtService.saveToken(value.token);
      applyUser(value);
      applyState('authenticated');
    },
    [applyState, applyUser, cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    jwtService.destroyToken();
    applyUser(null);
    applyState('unauthenticated');
  }, [applyState, applyUser, cancelRetry]);

  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!jwtService.getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
    retryAttempt.current += 1;
    retryTimer.current = setTimeout(() => {
      if (jwtService.getToken()) {
        applyState('loading');
        void refreshRef.current();
      }
    }, delaySeconds * 1000);
  }, [applyState, cancelRetry]);

  const setAuthUnavailable = useCallback(() => {
    applyUser(null);
    applyState('unavailable');
    scheduleRetry();
  }, [applyState, applyUser, scheduleRetry]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      const status = (err as { status?: number })?.status;
      if (typeof status === 'number' && status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setAuthUnavailable();
      }
    },
    [purgeAuth, setAuthUnavailable],
  );

  const refreshCurrentUser = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: User }>('/user');
      setAuth(data.user);
    } catch (err) {
      handleAuthError(err);
    }
  }, [handleAuthError, setAuth]);
  refreshRef.current = refreshCurrentUser;

  const login = useCallback(
    async (credentials: Credentials) => {
      const data = await apiClient.post<{ user: User }>('/users/login', { user: credentials });
      setAuth(data.user);
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const data = await apiClient.post<{ user: User }>('/users', { user: credentials });
      setAuth(data.user);
    },
    [setAuth],
  );

  const updateUser = useCallback(
    async (value: UpdateUserInput) => {
      const data = await apiClient.put<{ user: User }>('/user', { user: value });
      jwtService.saveToken(data.user.token);
      applyUser(data.user);
      return data.user;
    },
    [applyUser],
  );

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  useEffect(() => {
    setUnauthorizedHandler(() => purgeAuth());
    if (jwtService.getToken()) {
      void refreshCurrentUser();
    } else {
      purgeAuth();
    }
    return () => {
      setUnauthorizedHandler(null);
      cancelRetry();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => jwtService.getToken(),
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => userRef.current,
    };
  }, []);

  const value: AuthContextValue = {
    user,
    authState,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    updateUser,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
