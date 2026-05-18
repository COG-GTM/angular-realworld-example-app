import { api } from './api';

export const tagsService = {
  getAll(): Promise<string[]> {
    return api.get<{ tags: string[] }>('/tags').then(data => data.tags);
  },
};
