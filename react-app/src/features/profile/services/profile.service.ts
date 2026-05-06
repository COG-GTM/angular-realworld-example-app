import { api } from '../../../core/api';
import type { Profile } from '../models/profile.model';

export const ProfileService = {
  get(username: string): Promise<Profile> {
    return api.get<{ profile: Profile }>(`/profiles/${username}`).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return api.post<{ profile: Profile }>(`/profiles/${username}/follow`, {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return api.delete<{ profile: Profile }>(`/profiles/${username}/follow`).then(data => data.profile);
  },
};
