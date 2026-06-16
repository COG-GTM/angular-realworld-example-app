import type { Profile } from '../types/profile';
import { apiFetch } from './client';

export function get(username: string): Promise<Profile> {
  return apiFetch<{ profile: Profile }>(`/profiles/${username}`).then(d => d.profile);
}

export function follow(username: string): Promise<Profile> {
  return apiFetch<{ profile: Profile }>(`/profiles/${username}/follow`, { method: 'POST', body: {} }).then(
    d => d.profile,
  );
}

export function unfollow(username: string): Promise<Profile> {
  return apiFetch<{ profile: Profile }>(`/profiles/${username}/follow`, { method: 'DELETE' }).then(d => d.profile);
}
