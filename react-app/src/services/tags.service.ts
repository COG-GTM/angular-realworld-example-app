import { api } from './api';

export async function getTags(): Promise<string[]> {
  const data = await api.get<{ tags: string[] }>('/tags');
  return data.tags;
}
