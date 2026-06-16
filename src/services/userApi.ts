import { apiClient } from '../api/apiClient';
import type { User } from '../types/user';

interface UserResponse {
  user: User;
}

/**
 * Low-level calls to the current-user endpoints. State management (token storage,
 * auth state transitions, retries) lives in AuthContext.
 */
export const userApi = {
  login(credentials: { email: string; password: string }): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users/login', { user: credentials });
  },

  register(credentials: { username: string; email: string; password: string }): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/users', { user: credentials });
  },

  getCurrentUser(): Promise<UserResponse | undefined> {
    return apiClient.get<UserResponse | undefined>('/user');
  },

  update(user: Partial<User> & { password?: string }): Promise<UserResponse> {
    return apiClient.put<UserResponse>('/user', { user });
  },
};
