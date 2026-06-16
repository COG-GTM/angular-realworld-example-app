import { apiClient } from '../api/apiClient';

export const tagsService = {
  getAll(): Promise<string[]> {
    return apiClient.get<{ tags: string[] }>('/tags').then(data => data.tags);
  },
};
