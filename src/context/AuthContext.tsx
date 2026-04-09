import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { User } from "../models/user.model";
import api from "../services/api";
import { AUTH_PURGE_EVENT } from "../services/api";
import { getToken, saveToken, destroyToken } from "../services/jwt.service";

export type AuthState =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";

interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__: ConduitDebug;
  }
}

interface AuthContextType {
  currentUser: User | null;
  authState: AuthState;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  register: (credentials: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const setAuth = useCallback((user: User) => {
    cancelRetry();
    setCurrentUser(user);
    saveToken(user.token);
    setAuthState("authenticated");
  }, [cancelRetry]);

  const purgeAuth = useCallback(() => {
    cancelRetry();
    setCurrentUser(null);
    destroyToken();
    setAuthState("unauthenticated");
  }, [cancelRetry]);

  const fetchCurrentUser = useCallback(
    async (retryCount = 0) => {
      try {
        const response = await api.get("/user");
        setAuth(response.data.user);
      } catch (err: unknown) {
        const error = err as { status?: number };
        if (error.status && error.status >= 400 && error.status < 500) {
          purgeAuth();
        } else {
          // Server error — set unavailable and retry with exponential backoff
          setAuthState("unavailable");
          const delay = Math.min(2000 * Math.pow(2, retryCount), 16000);
          if (getToken()) {
            retryTimeoutRef.current = setTimeout(() => {
              if (getToken()) {
                fetchCurrentUser(retryCount + 1);
              }
            }, delay);
          }
        }
      }
    },
    [setAuth, purgeAuth],
  );

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchCurrentUser();
    } else {
      setAuthState("unauthenticated");
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchCurrentUser]);

  // Listen for 401 auth purge events from API interceptor
  useEffect(() => {
    const handleAuthPurge = () => {
      cancelRetry();
      setCurrentUser(null);
      setAuthState("unauthenticated");
    };
    window.addEventListener(AUTH_PURGE_EVENT, handleAuthPurge);
    return () => window.removeEventListener(AUTH_PURGE_EVENT, handleAuthPurge);
  }, []);

  // Debug interface for E2E tests
  useEffect(() => {
    window.__conduit_debug__ = {
      getToken,
      getAuthState: () => authState,
      getCurrentUser: () => currentUser,
    };
  }, [authState, currentUser]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await api.post("/users/login", {
        user: credentials,
      });
      setAuth(response.data.user);
    },
    [setAuth],
  );

  const register = useCallback(
    async (credentials: {
      username: string;
      email: string;
      password: string;
    }) => {
      const response = await api.post("/users", { user: credentials });
      setAuth(response.data.user);
    },
    [setAuth],
  );

  const logout = useCallback(() => {
    purgeAuth();
  }, [purgeAuth]);

  const updateUser = useCallback(
    async (user: Partial<User>) => {
      const response = await api.put("/user", { user });
      setAuth(response.data.user);
    },
    [setAuth],
  );

  const value: AuthContextType = {
    currentUser,
    authState,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
