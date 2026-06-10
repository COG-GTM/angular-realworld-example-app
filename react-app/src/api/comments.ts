import { apiClient } from './apiClient';
import type { Comment } from '../types';

export async function getComments(slug: string, signal?: AbortSignal): Promise<Comment[]> {
  const data = await apiClient.get<{ comments: Comment[] }>(`/articles/${slug}/comments`, { signal });
  return data.comments;
}

export async function addComment(slug: string, body: string): Promise<Comment> {
  const data = await apiClient.post<{ comment: Comment }>(`/articles/${slug}/comments`, {
    comment: { body },
  });
  return data.comment;
}

export async function deleteComment(commentId: string, slug: string): Promise<void> {
  await apiClient.delete<void>(`/articles/${slug}/comments/${commentId}`);
}
