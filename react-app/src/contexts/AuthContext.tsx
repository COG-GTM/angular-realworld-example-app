import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, AuthState } from '../models';
import { Auth } from '../services/api';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);

  const cancelRetry = useCallback(() => {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
  }, []);

  const setAuth = useCallback((userData: User) => {
    cancelRetry();
    retryAttemptRef.current = 0;
    Auth.saveToken(userData.token);
    setUser(userData);
    setAuthState('authenticated');
  }, [cancelRetry]);

  const purgeAuth = useCallback(() => {
    cancelRetry();
    retryAttemptRef.current = 0;
    Auth.destroyToken();
    setUser(null);
    setAuthState('unauthenticated');
  }, [cancelRetry]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { user: userData } = await Auth.current();
      setAuth(userData);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status && status >= 400 && status < 500) {
        purgeAuth();
      } else {
        setUser(null);
        setAuthState('unavailable');
        const delay = Math.min(2 * Math.pow(2, retryAttemptRef.current), 16);
        retryAttemptRef.current++;
        retryRef.current = setTimeout(() => {
          if (Auth.getToken()) {
            setAuthState('loading');
            fetchCurrentUser();
          }
        }, delay * 1000);
      }
    }
  }, [setAuth, purgeAuth]);

  useEffect(() => {
    const token = Auth.getToken();
    if (token) {
      fetchCurrentUser();
    } else {
      setAuthState('unauthenticated');
    }
    return () => cancelRetry();
  }, [fetchCurrentUser, cancelRetry]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: userData } = await Auth.login(email, password);
    setAuth(userData);
  }, [setAuth]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { user: userData } = await Auth.register(username, email, password);
    setAuth(userData);
  }, [setAuth]);

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<User> => {
    const { user: updated } = await Auth.update(userData);
    Auth.saveToken(updated.token);
    setUser(updated);
    return updated;
  }, []);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => Auth.getToken(),
      getAuthState: () => authState,
      getCurrentUser: () => user,
    };
  }, [authState, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
