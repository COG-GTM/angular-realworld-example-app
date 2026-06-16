import type { Profile } from './profile';

export interface Comment {
  id: string | number;
  body: string;
  createdAt: string;
  author: Profile;
}
