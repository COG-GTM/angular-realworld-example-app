import { api } from './client';

export const tagsApi = {
  getAll(): Promise<string[]> {
    return api.get<{ tags: string[] }>('/tags').then(data => data.tags);
  },
};
