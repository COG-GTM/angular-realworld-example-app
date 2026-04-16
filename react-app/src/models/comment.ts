import { Profile } from './profile';

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Profile;
}
