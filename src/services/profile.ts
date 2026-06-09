import { apiClient } from './api';
import type { Profile } from '../types';

/**
 * Fetches public profile data for any user by username.
 *
 * Note: different from the auth context which uses GET /user:
 * - GET /profiles/:username → public profile for any user (this service)
 * - GET /user → current authenticated user's own data (auth context)
 */
export const profileService = {
  get(username: string, signal?: AbortSignal): Promise<Profile> {
    return apiClient.get<{ profile: Profile }>('/profiles/' + username, { signal }).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return apiClient.post<{ profile: Profile }>('/profiles/' + username + '/follow', {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return apiClient.delete<{ profile: Profile }>('/profiles/' + username + '/follow').then(data => data.profile);
  },
};
