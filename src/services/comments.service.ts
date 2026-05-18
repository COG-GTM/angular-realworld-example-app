import { api } from './api';
import { Comment } from '../models/comment.model';

export const commentsService = {
  getAll(slug: string): Promise<Comment[]> {
    return api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
  },

  add(slug: string, body: string): Promise<Comment> {
    return api
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, {
        comment: { body },
      })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return api.del(`/articles/${slug}/comments/${commentId}`);
  },
};
