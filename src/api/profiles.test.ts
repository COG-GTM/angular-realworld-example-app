import { describe, expect, it } from 'vitest';
import * as profiles from './profiles';
import { fakeResponse, mockFetch } from '../test/fetchMock';
import type { Profile } from '../types/profile';

const BASE = 'https://api.realworld.show/api';
const mockProfile: Profile = { username: 'u', bio: null, image: null, following: false };

describe('profiles api', () => {
  it('gets a profile and unwraps it', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { profile: mockProfile } })));
    await expect(profiles.get('u')).resolves.toEqual(mockProfile);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/profiles/u`);
  });

  it('follows via POST', async () => {
    const fetchFn = mockFetch(() =>
      Promise.resolve(fakeResponse({ body: { profile: { ...mockProfile, following: true } } })),
    );
    const res = await profiles.follow('u');
    expect(res.following).toBe(true);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/profiles/u/follow`);
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('POST');
  });

  it('unfollows via DELETE', async () => {
    const fetchFn = mockFetch(() =>
      Promise.resolve(fakeResponse({ body: { profile: { ...mockProfile, following: false } } })),
    );
    const res = await profiles.unfollow('u');
    expect(res.following).toBe(false);
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('DELETE');
  });

  it('propagates a 404', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 404, body: { errors: { profile: ['not found'] } } })));
    await expect(profiles.get('nope')).rejects.toMatchObject({ status: 404 });
  });
});
