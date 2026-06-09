import { apiClient } from './api';
import type { Comment } from '../types';

export const commentsService = {
  getAll(slug: string, signal?: AbortSignal): Promise<Comment[]> {
    return apiClient.get<{ comments: Comment[] }>(`/articles/${slug}/comments`, { signal }).then(data => data.comments);
  },

  add(slug: string, payload: string): Promise<Comment> {
    return apiClient
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body: payload } })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${slug}/comments/${commentId}`);
  },
};
