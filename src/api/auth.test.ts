import { describe, expect, it } from 'vitest';
import * as auth from './auth';
import { fakeResponse, mockFetch } from '../test/fetchMock';
import type { User } from '../types/user';

const BASE = 'https://api.realworld.show/api';
const mockUser: User = {
  email: 'a@b.com',
  token: 't',
  username: 'u',
  bio: null,
  image: null,
};

describe('auth api', () => {
  it('logs in via POST /users/login', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { user: mockUser } })));
    await expect(auth.login({ email: 'a@b.com', password: 'p' })).resolves.toEqual(mockUser);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/users/login`);
    expect((fetchFn.mock.calls[0][1] as RequestInit).body).toBe(
      JSON.stringify({ user: { email: 'a@b.com', password: 'p' } }),
    );
  });

  it('registers via POST /users', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { user: mockUser } })));
    await auth.register({ username: 'u', email: 'a@b.com', password: 'p' });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/users`);
  });

  it('gets the current user via GET /user', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { user: mockUser } })));
    await expect(auth.getCurrentUser()).resolves.toEqual(mockUser);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/user`);
  });

  it('updates the current user via PUT /user', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { user: { ...mockUser, bio: 'new' } } })));
    const res = await auth.updateUser({ bio: 'new' });
    expect(res.bio).toBe('new');
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('PUT');
  });

  it('rejects with status on a failed login', async () => {
    mockFetch(() =>
      Promise.resolve(fakeResponse({ status: 403, body: { errors: { 'email or password': ['is invalid'] } } })),
    );
    await expect(auth.login({ email: 'x', password: 'y' })).rejects.toMatchObject({ status: 403 });
  });
});
