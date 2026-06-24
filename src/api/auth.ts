import type { User } from '../types';
import { requests, jwt } from './agent';

export async function login(credentials: { email: string; password: string }): Promise<User> {
  const data = await requests.post<{ user: User }>('/users/login', {
    user: credentials,
  });
  jwt.saveToken(data.user.token);
  return data.user;
}

export async function register(credentials: { username: string; email: string; password: string }): Promise<User> {
  const data = await requests.post<{ user: User }>('/users', {
    user: credentials,
  });
  jwt.saveToken(data.user.token);
  return data.user;
}

export async function getCurrentUser(): Promise<User> {
  const data = await requests.get<{ user: User }>('/user');
  return data.user;
}

export async function updateUser(user: Partial<User>): Promise<User> {
  const data = await requests.put<{ user: User }>('/user', { user });
  return data.user;
}
