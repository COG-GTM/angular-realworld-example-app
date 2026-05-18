import { api } from './api';
import { Profile } from '../models/profile.model';

export const profileService = {
  get(username: string): Promise<Profile> {
    return api.get<{ profile: Profile }>(`/profiles/${username}`).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return api.post<{ profile: Profile }>(`/profiles/${username}/follow`, {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return api.del<{ profile: Profile }>(`/profiles/${username}/follow`).then(data => data.profile);
  },
};
