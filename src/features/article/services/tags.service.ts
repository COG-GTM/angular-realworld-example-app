import { api } from '../../../core/api/api-client';

export async function getAll(): Promise<string[]> {
  const { data } = await api.get<{ tags: string[] }>('/tags');
  return data.tags;
}
