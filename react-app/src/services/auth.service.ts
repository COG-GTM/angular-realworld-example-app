import { api } from './api';
import { User } from '../models/user';

export function saveToken(token: string): void {
  localStorage.setItem('jwtToken', token);
}

export function getToken(): string | null {
  return localStorage.getItem('jwtToken');
}

export function destroyToken(): void {
  localStorage.removeItem('jwtToken');
}

export async function login(email: string, password: string): Promise<User> {
  const data = await api.post<{ user: User }>('/users/login', { user: { email, password } });
  saveToken(data.user.token);
  return data.user;
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const data = await api.post<{ user: User }>('/users', { user: { username, email, password } });
  saveToken(data.user.token);
  return data.user;
}

export async function getCurrentUser(): Promise<User> {
  const data = await api.get<{ user: User }>('/user');
  return data.user;
}

export async function updateUser(user: Partial<User>): Promise<User> {
  const data = await api.put<{ user: User }>('/user', { user });
  return data.user;
}
