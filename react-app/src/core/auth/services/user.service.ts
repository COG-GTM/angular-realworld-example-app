import { createContext, useContext } from 'react';
import type { User } from '../user.model';

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

export interface UserContextType {
  currentUser: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User> & { password?: string }) => Promise<User>;
}

export const UserContext = createContext<UserContextType>({
  currentUser: null,
  authState: 'loading',
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: async () => ({ email: '', token: '', username: '', bio: null, image: null }),
});

export function useUser(): UserContextType {
  return useContext(UserContext);
}
