import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, User } from '../types';
import { userService } from '../services/user';
import type { UserUpdate } from '../services/user';
import type { ApiError } from '../services/api';
import * as jwt from '../services/jwt';

interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  updateUser: (user: UserUpdate) => Promise<User>;
  getCurrentUserSync: () => User | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  // Refs kept in sync so the debug interface can read values synchronously.
  const currentUserRef = useRef<User | null>(null);
  const authStateRef = useRef<AuthState>('loading');
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUser = useCallback((user: User | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  }, []);

  const setState = useCallback((state: AuthState) => {
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
      jwt.saveToken(user.token);
      setUser(user);
      setState('authenticated');
    },
    [cancelRetry, setUser, setState],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    jwt.destroyToken();
    setUser(null);
    setState('unauthenticated');
  }, [cancelRetry, setUser, setState]);

  // Validate the stored token via GET /user. 4XX → invalid token (logout),
  // 5XX/network → server unavailable (keep token, schedule retry).
  const fetchCurrentUser = useCallback(async () => {
    try {
      const { user } = await userService.getCurrentUser();
      setAuth(user);
    } catch (err) {
      const status = (err as ApiError).status;
      if (status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setUser(null);
        setState('unavailable');
        scheduleRetry();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAuth, purgeAuth, setUser, setState]);

  // Exponential backoff: 2s, 4s, 8s, 16s, 16s... (capped at 16s).
  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!jwt.getToken()) {
      return;
    }
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
    retryAttempt.current += 1;
    retryTimer.current = setTimeout(() => {
      if (jwt.getToken()) {
        setState('loading');
        void fetchCurrentUser();
      }
    }, delaySeconds * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelRetry, setState]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { user } = await userService.login(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const { user } = await userService.register(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  const updateUser = useCallback(
    async (user: UserUpdate) => {
      const { user: updated } = await userService.update(user);
      setUser(updated);
      return updated;
    },
    [setUser],
  );

  const getCurrentUserSync = useCallback(() => currentUserRef.current, []);

  // Expose the framework-agnostic debug interface used by the e2e suite.
  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => jwt.getToken(),
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => currentUserRef.current,
    };
  }, []);

  // App initializer: check auth state at startup.
  useEffect(() => {
    if (jwt.getToken()) {
      void fetchCurrentUser();
    } else {
      purgeAuth();
    }
    return () => cancelRetry();
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
    getCurrentUserSync,
  };

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
