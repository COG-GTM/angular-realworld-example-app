import api from "./api";
import { Profile } from "../models/profile.model";

export const ProfileService = {
  get(username: string): Promise<Profile> {
    return api.get(`/profiles/${username}`).then((r) => r.data.profile);
  },

  follow(username: string): Promise<Profile> {
    return api
      .post(`/profiles/${username}/follow`)
      .then((r) => r.data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return api
      .delete(`/profiles/${username}/follow`)
      .then((r) => r.data.profile);
  },
};
