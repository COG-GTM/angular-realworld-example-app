import api from "./api";
import { Comment } from "../models/comment.model";

export const CommentsService = {
  getAll(slug: string): Promise<Comment[]> {
    return api
      .get(`/articles/${slug}/comments`)
      .then((r) => r.data.comments);
  },

  add(slug: string, body: string): Promise<Comment> {
    return api
      .post(`/articles/${slug}/comments`, { comment: { body } })
      .then((r) => r.data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return api.delete(`/articles/${slug}/comments/${commentId}`);
  },
};
