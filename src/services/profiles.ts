import { apiClient } from '../api/apiClient';
import type { Profile } from '../types';

export const profileService = {
  get(username: string): Promise<Profile> {
    return apiClient.get<{ profile: Profile }>(`/profiles/${username}`).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return apiClient.post<{ profile: Profile }>(`/profiles/${username}/follow`, {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return apiClient.delete<{ profile: Profile }>(`/profiles/${username}/follow`).then(data => data.profile);
  },
};
