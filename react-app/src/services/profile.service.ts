import { api } from './api';
import { Profile } from '../models/profile';

export async function getProfile(username: string): Promise<Profile> {
  const data = await api.get<{ profile: Profile }>(`/profiles/${username}`);
  return data.profile;
}

export async function followUser(username: string): Promise<Profile> {
  const data = await api.post<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const data = await api.del<{ profile: Profile }>(`/profiles/${username}/follow`);
  return data.profile;
}
