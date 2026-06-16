import { apiClient } from '../api/apiClient';
import type { Profile } from '../types/profile';

/**
 * Fetches public profile data for any user by username.
 * (Distinct from the auth user endpoint `/user`, which returns the current user.)
 */
export const profileService = {
  get(username: string): Promise<Profile> {
    return apiClient.get<{ profile: Profile }>('/profiles/' + username).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return apiClient.post<{ profile: Profile }>('/profiles/' + username + '/follow', {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return apiClient.del<{ profile: Profile }>('/profiles/' + username + '/follow').then(data => data.profile);
  },
};
