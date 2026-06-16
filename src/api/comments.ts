import type { Comment } from '../types/comment';
import { apiFetch } from './client';

export function getAll(slug: string): Promise<Comment[]> {
  return apiFetch<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(d => d.comments);
}

export function add(slug: string, body: string): Promise<Comment> {
  return apiFetch<{ comment: Comment }>(`/articles/${slug}/comments`, {
    method: 'POST',
    body: { comment: { body } },
  }).then(d => d.comment);
}

export function del(slug: string, commentId: string | number): Promise<void> {
  return apiFetch<void>(`/articles/${slug}/comments/${commentId}`, { method: 'DELETE' });
}
