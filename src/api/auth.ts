import type { User } from '../types/user';
import { apiFetch } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

/** Fields editable on the settings page (User fields plus an optional password). */
export interface UserUpdate extends Partial<User> {
  password?: string;
}

export function login(credentials: LoginCredentials): Promise<User> {
  return apiFetch<{ user: User }>('/users/login', { method: 'POST', body: { user: credentials } }).then(d => d.user);
}

export function register(credentials: RegisterCredentials): Promise<User> {
  return apiFetch<{ user: User }>('/users', { method: 'POST', body: { user: credentials } }).then(d => d.user);
}

export function getCurrentUser(): Promise<User> {
  return apiFetch<{ user: User }>('/user').then(d => d.user);
}

export function updateUser(user: UserUpdate): Promise<User> {
  return apiFetch<{ user: User }>('/user', { method: 'PUT', body: { user } }).then(d => d.user);
}
