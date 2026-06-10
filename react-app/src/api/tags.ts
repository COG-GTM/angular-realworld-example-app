import { apiClient } from './apiClient';

export async function getTags(signal?: AbortSignal): Promise<string[]> {
  const data = await apiClient.get<{ tags: string[] }>('/tags', { signal });
  return data.tags;
}
