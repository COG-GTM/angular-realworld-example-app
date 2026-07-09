import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, type NormalizedError } from '../api/api-client';
import { destroyToken, getToken, saveToken } from './jwt';
import { User } from '../models/user';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

/**
 * Debug interface for testing - exposes app state in a framework-agnostic way.
 * e2e tests rely on window.__conduit_debug__ instead of poking internal state.
 */
export interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

export interface UserContextValue {
  authState: AuthState;
  currentUser: User | null;
  isAuthenticated: boolean;
  /** True once the initial startup auth check has completed. */
  initialized: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ user: User }>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<{ user: User }>;
  logout: () => void;
  getCurrentUser: () => Promise<{ user: User }>;
  update: (user: Partial<User>) => Promise<{ user: User }>;
  getCurrentUserSync: () => User | null;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * UserProvider - manages authentication state for the current user.
 *
 * Auth states:
 * - 'loading': checking if the stored token is valid
 * - 'authenticated': token valid, user data loaded
 * - 'unauthenticated': no token or token invalid (4XX error)
 * - 'unavailable': server error (5XX / network), token kept, auto-retry
 *
 * On GET /user, 4XX means "your token is bad" (clear it) while 5XX/network
 * means "server is broken" (keep token, retry with exponential backoff:
 * 2s -> 4s -> 8s -> 16s, capped at 16s).
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [authState, setAuthStateValue] = useState<AuthState>('loading');
  const [currentUser, setCurrentUserValue] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  const authStateRef = useRef<AuthState>('loading');
  const currentUserRef = useRef<User | null>(null);
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAuthState = useCallback((state: AuthState) => {
    authStateRef.current = state;
    setAuthStateValue(state);
  }, []);

  const setUser = useCallback((user: User | null) => {
    currentUserRef.current = user;
    setCurrentUserValue(user);
  }, []);

  const cancelRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const setAuth = useCallback(
    (user: User) => {
      cancelRetry();
      retryAttemptRef.current = 0;
      saveToken(user.token);
      setUser(user);
      setAuthState('authenticated');
    },
    [cancelRetry, setUser, setAuthState],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttemptRef.current = 0;
    destroyToken();
    setUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry, setUser, setAuthState]);

  const getCurrentUser = useCallback(async (): Promise<{ user: User }> => {
    try {
      const { data } = await api.get<{ user: User }>('/user');
      if (data && typeof data === 'object' && data.user && typeof data.user.token === 'string') {
        setAuth(data.user);
        return data;
      }
      // 2XX but empty / malformed body -> treat as server unavailable.
      setAuthUnavailableRef.current();
      return Promise.reject<{ user: User }>({ errors: {}, status: 200 } as NormalizedError);
    } catch (err) {
      const status = (err as NormalizedError)?.status ?? 0;
      handleAuthErrorRef.current(status);
      return Promise.reject(err as NormalizedError);
    }
  }, [setAuth]);

  // Refs to break the circular dependency between getCurrentUser, scheduleRetry,
  // setAuthUnavailable and handleAuthError.
  const getCurrentUserRef = useRef(getCurrentUser);
  getCurrentUserRef.current = getCurrentUser;

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16);
    retryAttemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (getToken()) {
        setAuthState('loading');
        void getCurrentUserRef.current().catch(() => undefined);
      }
    }, delaySeconds * 1000);
  }, [cancelRetry, setAuthState]);

  const setAuthUnavailable = useCallback(() => {
    setUser(null);
    setAuthState('unavailable');
    scheduleRetry();
  }, [setUser, setAuthState, scheduleRetry]);
  const setAuthUnavailableRef = useRef(setAuthUnavailable);
  setAuthUnavailableRef.current = setAuthUnavailable;

  const handleAuthError = useCallback(
    (status: number) => {
      if (status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setAuthUnavailable();
      }
    },
    [purgeAuth, setAuthUnavailable],
  );
  const handleAuthErrorRef = useRef(handleAuthError);
  handleAuthErrorRef.current = handleAuthError;

  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<{ user: User }> => {
      const { data } = await api.post<{ user: User }>('/users/login', { user: credentials });
      setAuth(data.user);
      return data;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }): Promise<{ user: User }> => {
      const { data } = await api.post<{ user: User }>('/users', { user: credentials });
      setAuth(data.user);
      return data;
    },
    [setAuth],
  );

  const update = useCallback(
    async (user: Partial<User>): Promise<{ user: User }> => {
      const { data } = await api.put<{ user: User }>('/user', { user });
      setUser(data.user);
      return data;
    },
    [setUser],
  );

  const logout = useCallback(() => {
    purgeAuth();
    navigate('/');
  }, [purgeAuth, navigate]);

  const getCurrentUserSync = useCallback(() => currentUserRef.current, []);

  // Startup: set up debug interface + validate any stored token.
  useEffect(() => {
    setUnauthorizedHandler(() => purgeAuth());

    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => currentUserRef.current,
    };

    const init = async () => {
      if (getToken()) {
        try {
          await getCurrentUserRef.current();
        } catch {
          // getCurrentUser already updated auth state via handleAuthError.
        }
      } else {
        purgeAuth();
      }
      setInitialized(true);
    };
    void init();

    return () => {
      cancelRetry();
      setUnauthorizedHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: UserContextValue = {
    authState,
    currentUser,
    isAuthenticated: !!currentUser,
    initialized,
    login,
    register,
    logout,
    getCurrentUser,
    update,
    getCurrentUserSync,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

export function useIsAuthenticated(): boolean {
  return useUser().isAuthenticated;
}
