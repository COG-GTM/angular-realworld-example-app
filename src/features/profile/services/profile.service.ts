import { api } from '../../../core/api/api-client';
import { Profile } from '../models/profile';

/**
 * Fetches public profile data for any user by username.
 *
 * Note: this is different from the current-user endpoints in UserService:
 * - GET /profiles/:username -> public profile for any user (this service)
 * - GET /user -> current authenticated user's own data (UserService)
 */
export async function getProfile(username: string): Promise<Profile> {
  const { data } = await api.get<{ profile: Profile }>('/profiles/' + username);
  return data.profile;
}

export async function follow(username: string): Promise<Profile> {
  const { data } = await api.post<{ profile: Profile }>('/profiles/' + username + '/follow', {});
  return data.profile;
}

export async function unfollow(username: string): Promise<Profile> {
  const { data } = await api.delete<{ profile: Profile }>('/profiles/' + username + '/follow');
  return data.profile;
}
