import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, jwt } from '../api/client';
import { authApi } from '../api/services';
import type { User } from '../types';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

interface UserContextValue {
  user: User | null;
  authState: AuthState;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => string;
      getCurrentUser: () => User | null;
    };
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>(jwt.getToken() ? 'loading' : 'unauthenticated');

  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (!jwt.getToken()) return;
    let cancelled = false;
    authApi
      .getCurrentUser()
      .then(({ user }) => {
        if (cancelled) return;
        setUserState(user);
        setAuthState('authenticated');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
          jwt.destroyToken();
          setUserState(null);
          setAuthState('unauthenticated');
        } else {
          // Server error or network failure: keep the token and retry with backoff
          setAuthState('unavailable');
          const delay = Math.min(1000 * 2 ** retryAttempt, 30000);
          setTimeout(() => {
            if (!cancelled) setRetryAttempt(a => a + 1);
          }, delay);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retryAttempt]);

  const login = useCallback((user: User) => {
    jwt.saveToken(user.token);
    setUserState(user);
    setAuthState('authenticated');
  }, []);

  const logout = useCallback(() => {
    jwt.destroyToken();
    setUserState(null);
    setAuthState('unauthenticated');
  }, []);

  const setUser = useCallback((user: User) => {
    jwt.saveToken(user.token);
    setUserState(user);
  }, []);

  const value = useMemo(() => ({ user, authState, login, logout, setUser }), [user, authState, login, logout, setUser]);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => jwt.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => user,
    };
  }, [user, authState]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
