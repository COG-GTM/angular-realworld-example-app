import type { Profile } from '../types';
import { requests } from './agent';

export async function getProfile(username: string): Promise<Profile> {
  const data = await requests.get<{ profile: Profile }>(`/profiles/${username}`);
  return data.profile;
}

export async function followUser(username: string): Promise<Profile> {
  const data = await requests.post<{ profile: Profile }>(`/profiles/${username}/follow`, {});
  return data.profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const data = await requests.del<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}
