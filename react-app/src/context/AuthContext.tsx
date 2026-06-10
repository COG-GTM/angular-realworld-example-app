import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, User, UserSettingsUpdate } from '../types';
import { getToken, saveToken, destroyToken } from '../api/jwt';
import { setUnauthorizedHandler } from '../api/apiClient';
import { loginRequest, registerRequest, getCurrentUserRequest, updateUserRequest } from '../api/users';
import { AuthContext, type AuthContextValue } from './auth-context';

/**
 * AuthProvider replaces the Angular `UserService`. It owns the reactive auth
 * state machine ('loading' | 'authenticated' | 'unauthenticated' | 'unavailable')
 * and the current user, and mirrors the original 4XX-vs-5XX handling on
 * `GET /user` with exponential-backoff auto-retry while 'unavailable'.
 */

interface ApiErrorLike {
  status?: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  // Live mirrors for use inside async callbacks (debug interface, retry timer).
  const currentUserRef = useRef<User | null>(null);
  const authStateRef = useRef<AuthState>('loading');
  const retryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getCurrentUserRef = useRef<() => Promise<void>>(async () => {});

  const updateCurrentUser = useCallback((user: User | null) => {
    currentUserRef.current = user;
    setCurrentUser(user);
  }, []);

  const updateAuthState = useCallback((state: AuthState) => {
    authStateRef.current = state;
    setAuthState(state);
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
      updateCurrentUser(user);
      updateAuthState('authenticated');
    },
    [cancelRetry, updateAuthState, updateCurrentUser],
  );

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttemptRef.current = 0;
    destroyToken();
    updateCurrentUser(null);
    updateAuthState('unauthenticated');
  }, [cancelRetry, updateAuthState, updateCurrentUser]);

  const scheduleRetry = useCallback(() => {
    cancelRetry();
    if (!getToken()) {
      return;
    }
    // Delay: 2, 4, 8, 16, 16, 16... (capped at 16s).
    const delaySeconds = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16);
    retryAttemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (getToken()) {
        updateAuthState('loading');
        void getCurrentUserRef.current();
      }
    }, delaySeconds * 1000);
  }, [cancelRetry, updateAuthState]);

  const handleAuthError = useCallback(
    (status: number) => {
      if (status >= 400 && status < 500) {
        purgeAuth();
      } else {
        updateCurrentUser(null);
        updateAuthState('unavailable');
        scheduleRetry();
      }
    },
    [purgeAuth, scheduleRetry, updateAuthState, updateCurrentUser],
  );

  const getCurrentUser = useCallback(async () => {
    try {
      const user = await getCurrentUserRequest();
      setAuth(user);
    } catch (err) {
      handleAuthError((err as ApiErrorLike).status ?? 0);
    }
  }, [handleAuthError, setAuth]);

  getCurrentUserRef.current = getCurrentUser;

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const user = await loginRequest(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const user = await registerRequest(credentials);
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
    void navigate('/');
  }, [navigate, purgeAuth]);

  const updateUser = useCallback(
    async (user: UserSettingsUpdate) => {
      const updated = await updateUserRequest(user);
      updateCurrentUser(updated);
      return updated;
    },
    [updateCurrentUser],
  );

  // App initializer: wire the global 401 handler + debug interface, then verify
  // any stored token. Runs once on mount.
  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);

    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => authStateRef.current,
      getCurrentUser: () => currentUserRef.current,
    };

    if (getToken()) {
      void getCurrentUser();
    } else {
      purgeAuth();
    }

    return () => cancelRetry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    currentUser,
    authState,
    isAuthenticated: currentUser !== null,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => AuthState;
      getCurrentUser: () => User | null;
    };
  }
}
