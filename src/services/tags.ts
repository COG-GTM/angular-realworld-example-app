import { apiClient } from './api';

export const tagsService = {
  getAll(signal?: AbortSignal): Promise<string[]> {
    return apiClient.get<{ tags: string[] }>('/tags', { signal }).then(data => data.tags);
  },
};
