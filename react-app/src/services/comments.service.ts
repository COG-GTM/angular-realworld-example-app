import type { Comment } from '../types';
import { api } from './api';

export function getComments(slug: string, signal?: AbortSignal): Promise<Comment[]> {
  return api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`, signal).then(d => d.comments);
}

export function addComment(slug: string, body: string): Promise<Comment> {
  return api.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } }).then(d => d.comment);
}

export function deleteComment(commentId: string, slug: string): Promise<void> {
  return api.delete(`/articles/${slug}/comments/${commentId}`);
}
