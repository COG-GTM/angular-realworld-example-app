import { api } from './api';

export function getTags(signal?: AbortSignal): Promise<string[]> {
  return api.get<{ tags: string[] }>('/tags', signal).then(d => d.tags);
}
