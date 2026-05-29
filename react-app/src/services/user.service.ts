import type { User } from '../types';
import { api, saveToken, destroyToken } from './api';

export function login(credentials: { email: string; password: string }): Promise<User> {
  return api.post<{ user: User }>('/users/login', { user: credentials }).then(d => {
    saveToken(d.user.token);
    return d.user;
  });
}

export function register(credentials: { username: string; email: string; password: string }): Promise<User> {
  return api.post<{ user: User }>('/users', { user: credentials }).then(d => {
    saveToken(d.user.token);
    return d.user;
  });
}

export function getCurrentUser(signal?: AbortSignal): Promise<User> {
  return api.get<{ user: User }>('/user', signal).then(d => d.user);
}

export function updateUser(user: Partial<User> & { password?: string }): Promise<User> {
  return api.put<{ user: User }>('/user', { user }).then(d => {
    saveToken(d.user.token);
    return d.user;
  });
}

export function logout(): void {
  destroyToken();
}
