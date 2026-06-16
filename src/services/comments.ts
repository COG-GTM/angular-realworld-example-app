import { apiClient } from '../api/apiClient';
import type { Comment } from '../types';

export const commentsService = {
  getAll(slug: string): Promise<Comment[]> {
    return apiClient.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
  },

  add(slug: string, body: string): Promise<Comment> {
    return apiClient
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${slug}/comments/${commentId}`);
  },
};
