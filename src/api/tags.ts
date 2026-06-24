import { requests } from './agent';

export async function getTags(): Promise<string[]> {
  const data = await requests.get<{ tags: string[] }>('/tags');
  return data.tags;
}
