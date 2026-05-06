import { api } from '../../../core/api';
import type { Comment } from '../models/comment.model';

export const CommentsService = {
  getAll(slug: string): Promise<Comment[]> {
    return api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
  },

  add(slug: string, body: string): Promise<Comment> {
    return api
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return api.delete<void>(`/articles/${slug}/comments/${commentId}`);
  },
};
