import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { userApi } from '../api/services';
import { setUnauthorizedHandler, type ApiError } from '../api/client';
import { destroyToken, getToken, saveToken } from '../api/jwt';
import type { AuthState, User } from '../types';

/**
 * Debug interface for testing - exposes app state in a framework-agnostic way.
 * Tests can use this instead of directly accessing localStorage or internal state.
 */
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

interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  /** True once the initial auth check has resolved (mirrors APP_INITIALIZER). */
  initialized: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  update: (user: Partial<User> & { password?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [initialized, setInitialized] = useState(false);

  // Refs mirror the latest state for the debug interface and retry scheduling.
  const currentUserRef = useRef<User | null>(null);
  const authStateRef = useRef<AuthState>('loading');
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyUser = useCallback((user: User | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  }, []);

  const applyAuthState = useCallback((state: AuthState) => {
    authStateRef.current = state;
    setAuthState(state);
  }, []);

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
      applyUser(user);
      applyAuthState('authenticated');
    },
    [applyAuthState, applyUser, cancelRetry],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    destroyToken();
    applyUser(null);
    applyAuthState('unauthenticated');
  }, [applyAuthState, applyUser, cancelRetry]);

  // getCurrentUser + error handling, including 4XX vs 5XX distinction and
  // exponential-backoff retry while the server is unavailable.
  const getCurrentUser = useRef<() => Promise<User | null>>(() => Promise.resolve(null));

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
    retryAttempt.current += 1;
    retryTimer.current = setTimeout(() => {
      if (getToken()) {
        applyAuthState('loading');
        void getCurrentUser.current();
      }
    }, delaySeconds * 1000);
  }, [applyAuthState, cancelRetry]);

  const setAuthUnavailable = useCallback(() => {
    applyUser(null);
    applyAuthState('unavailable');
    scheduleRetry();
  }, [applyAuthState, applyUser, scheduleRetry]);

  getCurrentUser.current = useCallback(async () => {
    try {
      const { user } = await userApi.getCurrentUser();
      setAuth(user);
      return user;
    } catch (err) {
      const status = (err as ApiError).status;
      if (status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setAuthUnavailable();
      }
      return null;
    }
  }, [purgeAuth, setAuth, setAuthUnavailable]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { user } = await userApi.login(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const { user } = await userApi.register(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const update = useCallback(async (user: Partial<User> & { password?: string }) => {
    const { user: updated } = await userApi.update(user);
    applyUser(updated);
    return updated;
  }, [applyUser]);

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  // App initializer: validate stored token at startup.
  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);
    window.__conduit_debug__ = {
      getToken,
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => currentUserRef.current,
    };

    const init = async () => {
      if (getToken()) {
        await getCurrentUser.current();
      } else {
        purgeAuth();
      }
      setInitialized(true);
    };
    void init();

    return () => cancelRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    currentUser,
    authState,
    isAuthenticated: !!currentUser,
    initialized,
    login,
    register,
    logout,
    update,
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
