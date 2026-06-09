import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { jwt } from '../api/client';
import { authApi } from '../api/services';
import type { User } from '../types';

export type AuthState = 'authenticated' | 'unauthenticated' | 'loading';

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

  useEffect(() => {
    if (!jwt.getToken()) return;
    authApi
      .getCurrentUser()
      .then(({ user }) => {
        setUserState(user);
        setAuthState('authenticated');
      })
      .catch(() => {
        jwt.destroyToken();
        setUserState(null);
        setAuthState('unauthenticated');
      });
  }, []);

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
