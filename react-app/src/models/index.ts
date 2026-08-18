export interface Profile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Profile;
}

export interface Errors {
  errors: { [key: string]: string };
}

export interface ArticleListConfig {
  type: string;
  filters: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  };
}

export type AuthState = 'authenticated' | 'unauthenticated' | 'unavailable' | 'loading';

export const LoadingState = {
  NOT_LOADED: 'NOT_LOADED',
  LOADING: 'LOADING',
  LOADED: 'LOADED',
} as const;

export type LoadingState = (typeof LoadingState)[keyof typeof LoadingState];

export type UserSettings = Partial<User> & { password?: string };
