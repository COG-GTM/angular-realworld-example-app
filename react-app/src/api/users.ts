import { apiClient } from './apiClient';
import type { User, UserSettingsUpdate } from '../types';

export async function loginRequest(credentials: { email: string; password: string }): Promise<User> {
  const data = await apiClient.post<{ user: User }>('/users/login', { user: credentials });
  return data.user;
}

export async function registerRequest(credentials: {
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const data = await apiClient.post<{ user: User }>('/users', { user: credentials });
  return data.user;
}

export async function getCurrentUserRequest(signal?: AbortSignal): Promise<User> {
  const data = await apiClient.get<{ user: User }>('/user', { signal });
  return data.user;
}

export async function updateUserRequest(user: UserSettingsUpdate): Promise<User> {
  const data = await apiClient.put<{ user: User }>('/user', { user });
  return data.user;
}
