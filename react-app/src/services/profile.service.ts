import type { Profile } from '../types';
import { api } from './api';

export function getProfile(username: string, signal?: AbortSignal): Promise<Profile> {
  return api.get<{ profile: Profile }>(`/profiles/${username}`, signal).then(d => d.profile);
}

export function followUser(username: string): Promise<Profile> {
  return api.post<{ profile: Profile }>(`/profiles/${username}/follow`).then(d => d.profile);
}

export function unfollowUser(username: string): Promise<Profile> {
  return api.delete<{ profile: Profile }>(`/profiles/${username}/follow`).then(d => d.profile);
}
