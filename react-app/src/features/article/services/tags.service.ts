import { api } from '../../../core/api';

export const TagsService = {
  getAll(): Promise<string[]> {
    return api.get<{ tags: string[] }>('/tags').then(data => data.tags);
  },
};
