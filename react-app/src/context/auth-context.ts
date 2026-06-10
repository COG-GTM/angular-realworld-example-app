import { createContext } from 'react';
import type { User, AuthState, UserSettingsUpdate } from '../types';

/**
 * Context object + value type for the auth state machine. Kept separate from the
 * `AuthProvider` component so the provider file only exports components (this
 * keeps React Fast Refresh happy).
 */
export interface AuthContextValue {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<User>;
  logout: () => void;
  updateUser: (user: UserSettingsUpdate) => Promise<User>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
