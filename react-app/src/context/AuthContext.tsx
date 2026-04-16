import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../models/user';
import { getCurrentUser, saveToken, destroyToken, getToken } from '../services/auth.service';

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

  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then((u) => { setUserState(u); setLoading(false); })
        .catch(() => { destroyToken(); setLoading(false); });
    } else {
      setLoading(false);
    }
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
