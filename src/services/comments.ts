import { apiClient } from '../api/apiClient';
import type { Comment } from '../types/comment';

export const commentsService = {
  getAll(slug: string): Promise<Comment[]> {
    return apiClient.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
  },

  add(slug: string, payload: string): Promise<Comment> {
    return apiClient
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body: payload } })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return apiClient.del<void>(`/articles/${slug}/comments/${commentId}`);
  },
};
