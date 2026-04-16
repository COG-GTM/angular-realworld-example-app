import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../models/user';
import { getCurrentUser, saveToken, destroyToken, getToken } from '../services/auth.service';

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => string;
      getCurrentUser: () => User | null;
    };
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then((u) => { setUserState(u); userRef.current = u; setLoading(false); loadingRef.current = false; })
        .catch(() => { destroyToken(); setLoading(false); loadingRef.current = false; });
    } else {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    window.__conduit_debug__ = {
      getToken: () => getToken(),
      getAuthState: () => {
        if (loadingRef.current) return 'loading';
        return userRef.current ? 'authenticated' : 'unauthenticated';
      },
      getCurrentUser: () => userRef.current,
    };
    return () => { delete window.__conduit_debug__; };
  }, []);

  const setUser = useCallback((u: User) => {
    saveToken(u.token);
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    destroyToken();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
