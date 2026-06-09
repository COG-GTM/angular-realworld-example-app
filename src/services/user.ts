import { apiClient } from './api';
import type { User } from '../types';

/** Settings form payload — user fields plus an optional new password. */
export type UserUpdate = Partial<User> & { password?: string };

/**
 * Auth/user API calls. State management (current user, auth state, retry) lives
 * in the AuthContext; this module only wraps the raw endpoints.
 */
export const userService = {
  login(credentials: { email: string; password: string }): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/users/login', { user: credentials });
  },

  register(credentials: { username: string; email: string; password: string }): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/users', { user: credentials });
  },

  getCurrentUser(signal?: AbortSignal): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/user', { signal });
  },

  update(user: UserUpdate): Promise<{ user: User }> {
    return apiClient.put<{ user: User }>('/user', { user });
  },
};
