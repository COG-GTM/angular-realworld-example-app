import { api } from './client';
import { Profile } from '../types';

// Fetches public profile data for any user by username (GET /profiles/:username),
// distinct from the authenticated user's own data (GET /user).
export const profilesApi = {
  get(username: string): Promise<Profile> {
    return api.get<{ profile: Profile }>('/profiles/' + username).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return api.post<{ profile: Profile }>('/profiles/' + username + '/follow', {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return api.delete<{ profile: Profile }>('/profiles/' + username + '/follow').then(data => data.profile);
  },
};
