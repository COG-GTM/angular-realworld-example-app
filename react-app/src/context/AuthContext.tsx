import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthState } from '../types';
import { getCurrentUser, logout as logoutService } from '../services/user.service';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authState: 'loading',
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    const token = window.localStorage.getItem('jwtToken');
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }

    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then(u => {
        setUser(u);
        setAuthState('authenticated');
      })
      .catch(() => {
        setAuthState('unauthenticated');
      });

    return () => controller.abort();
  }, []);

  const handleSetUser = useCallback((u: User | null) => {
    setUser(u);
    setAuthState(u ? 'authenticated' : 'unauthenticated');
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
    setAuthState('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ user, authState, setUser: handleSetUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
