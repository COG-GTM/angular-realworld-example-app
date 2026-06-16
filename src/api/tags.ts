import { apiFetch } from './client';

export function getAll(): Promise<string[]> {
  return apiFetch<{ tags: string[] }>('/tags').then(d => d.tags);
}
