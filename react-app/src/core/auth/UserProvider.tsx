import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from './user.model';
import { JwtService } from './services/jwt.service';
import { UserContext } from './services/user.service';
import type { AuthState } from './services/user.service';
import { api } from '../api';

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const navigate = useNavigate();

  const setAuth = useCallback((user: User) => {
    JwtService.saveToken(user.token);
    setCurrentUser(user);
    setAuthState('authenticated');
  }, []);

  const purgeAuth = useCallback(() => {
    JwtService.destroyToken();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }, []);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => JwtService.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => currentUser,
    };
  }, [authState, currentUser]);

  useEffect(() => {
    const token = JwtService.getToken();
    if (token) {
      api
        .get<{ user: User }>('/user')
        .then(({ user }) => setAuth(user))
        .catch((err: { status?: number }) => {
          if (err.status && err.status >= 400 && err.status < 500) {
            purgeAuth();
          } else {
            setCurrentUser(null);
            setAuthState('unavailable');
          }
        });
    } else {
      purgeAuth();
    }
  }, [setAuth, purgeAuth]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const { user } = await api.post<{ user: User }>('/users/login', { user: credentials });
      setAuth(user);
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: { username: string; email: string; password: string }) => {
      const { user } = await api.post<{ user: User }>('/users', { user: credentials });
      setAuth(user);
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
    navigate('/');
  }, [purgeAuth, navigate]);

  const updateUser = useCallback(
    async (userData: Partial<User> & { password?: string }): Promise<User> => {
      const { user } = await api.put<{ user: User }>('/user', { user: userData });
      setAuth(user);
      return user;
    },
    [setAuth],
  );

  const value = useMemo(
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

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
