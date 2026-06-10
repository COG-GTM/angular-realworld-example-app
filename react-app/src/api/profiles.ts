import { apiClient } from './apiClient';
import type { Profile } from '../types';

export async function getProfile(username: string, signal?: AbortSignal): Promise<Profile> {
  const data = await apiClient.get<{ profile: Profile }>(`/profiles/${username}`, { signal });
  return data.profile;
}

export async function followUser(username: string): Promise<Profile> {
  const data = await apiClient.post<{ profile: Profile }>(`/profiles/${username}/follow`, {});
  return data.profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const data = await apiClient.delete<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}
