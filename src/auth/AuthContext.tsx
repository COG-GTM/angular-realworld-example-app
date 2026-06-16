import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/user';
import { userApi } from '../services/userApi';
import * as jwt from './jwt';
import { setUnauthorizedHandler } from '../api/apiClient';
import { installDebugInterface } from './debug';

/**
 * AuthState mirrors the Angular UserService:
 * - 'loading'         initial state while the stored token is being validated
 * - 'authenticated'   token valid, user loaded
 * - 'unauthenticated' no token / token invalid (4XX) — token cleared
 * - 'unavailable'     server error (5XX) / network / parse error — token kept, auto-retry
 */
export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User> & { password?: string }) => Promise<User>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  // Refs hold the latest values for use inside timers, the 401 handler and the
  // debug interface getters (which must always read live state).
  const currentUserRef = useRef<User | null>(null);
  const authStateRef = useRef<AuthState>('loading');
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const setUser = (user: User | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  };
  const setState = (state: AuthState) => {
    authStateRef.current = state;
    setAuthState(state);
  };

  const cancelRetry = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const setAuth = (user: User) => {
    cancelRetry();
    retryAttemptRef.current = 0;
    jwt.saveToken(user.token);
    setUser(user);
    setState('authenticated');
  };

  const purgeAuth = () => {
    cancelRetry();
    retryAttemptRef.current = 0;
    jwt.destroyToken();
    setUser(null);
    setState('unauthenticated');
  };

  // Exponential backoff retry: 2s, 4s, 8s, 16s, 16s... (capped at 16s).
  const scheduleRetry = () => {
    cancelRetry();
    if (!jwt.getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16);
    retryAttemptRef.current += 1;
    retryTimerRef.current = window.setTimeout(() => {
      if (jwt.getToken()) {
        setState('loading');
        void refreshRef.current();
      }
    }, delaySeconds * 1000);
  };

  const setAuthUnavailable = () => {
    setUser(null);
    setState('unavailable');
    scheduleRetry();
  };

  const refreshCurrentUser = async () => {
    try {
      const data = await userApi.getCurrentUser();
      if (!data || !data.user) {
        // Empty/garbage 2xx body — treat as a temporary server problem (keep token).
        setAuthUnavailable();
        return;
      }
      setAuth(data.user);
    } catch (err) {
      const status = (err as { status?: number })?.status ?? 0;
      if (status >= 400 && status < 500) {
        // Client error: token is invalid → logout.
        purgeAuth();
      } else {
        // Server/network/parse error → keep token and retry.
        setAuthUnavailable();
      }
    }
  };
  refreshRef.current = refreshCurrentUser;

  const login = async (credentials: { email: string; password: string }) => {
    const { user } = await userApi.login(credentials);
    setAuth(user);
  };

  const register = async (credentials: { username: string; email: string; password: string }) => {
    const { user } = await userApi.register(credentials);
    setAuth(user);
  };

  const updateUser = async (partial: Partial<User> & { password?: string }): Promise<User> => {
    const { user } = await userApi.update(partial);
    setUser(user);
    return user;
  };

  const logout = () => {
    purgeAuth();
  };

  // One-time initialization: wire the global 401 handler + debug interface, then
  // validate the stored token (or settle into 'unauthenticated' if there is none).
  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);
    installDebugInterface({
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => currentUserRef.current,
    });

    if (jwt.getToken()) {
      void refreshCurrentUser();
    } else {
      purgeAuth();
    }

    return () => {
      cancelRetry();
      setUnauthorizedHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    currentUser,
    authState,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateUser,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
