import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, usersApi } from '../services/api';
import { jwtService } from '../services/jwt';
import type { ApiError } from '../services/api';
import type { AuthState, User, UserSettings } from '../models';

interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { email: string; password: string; username: string }) => Promise<User>;
  update: (user: UserSettings) => Promise<User>;
  logout: () => void;
  purgeAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mirrors the Angular UserService: owns the auth state machine
 * (loading → authenticated | unauthenticated | unavailable), persists the JWT in
 * localStorage under the same `jwtToken` key, and retries GET /user with
 * exponential backoff (2s, 4s, 8s, 16s, capped) while the server is unavailable.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const retryAttempt = useRef(0);
  const retryTimer = useRef<number | null>(null);

  const cancelRetry = useCallback(() => {
    if (retryTimer.current !== null) {
      window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttempt.current = 0;
    jwtService.destroyToken();
    setCurrentUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry]);

  const setAuth = useCallback(
    (user: User) => {
      cancelRetry();
      retryAttempt.current = 0;
      jwtService.saveToken(user.token);
      setCurrentUser(user);
      setAuthState('authenticated');
    },
    [cancelRetry],
  );

  const loadCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const { user } = await usersApi.current();
      setAuth(user);
    } catch (error) {
      const status = (error as ApiError).status ?? 0;
      if (status >= 400 && status < 500) {
        purgeAuth();
        return;
      }

      setCurrentUser(null);
      setAuthState('unavailable');

      if (!jwtService.getToken()) return;
      const delaySeconds = Math.min(2 * Math.pow(2, retryAttempt.current), 16);
      retryAttempt.current += 1;
      cancelRetry();
      retryTimer.current = window.setTimeout(() => {
        if (jwtService.getToken()) {
          setAuthState('loading');
          void loadCurrentUser();
        }
      }, delaySeconds * 1000);
    }
  }, [cancelRetry, purgeAuth, setAuth]);

  useEffect(() => {
    setUnauthorizedHandler(purgeAuth);
    if (jwtService.getToken()) {
      void loadCurrentUser();
    } else {
      purgeAuth();
    }
    return cancelRetry;
  }, [cancelRetry, loadCurrentUser, purgeAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      authState,
      isAuthenticated: currentUser !== null,
      login: async credentials => {
        const { user } = await usersApi.login(credentials);
        setAuth(user);
        return user;
      },
      register: async credentials => {
        const { user } = await usersApi.register(credentials);
        setAuth(user);
        return user;
      },
      update: async partial => {
        const { user } = await usersApi.update(partial);
        setCurrentUser(user);
        return user;
      },
      logout: purgeAuth,
      purgeAuth,
    }),
    [authState, currentUser, purgeAuth, setAuth],
  );

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => jwtService.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => currentUser,
    };
  }, [authState, currentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
