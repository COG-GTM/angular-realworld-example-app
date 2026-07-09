import { api } from '../../../core/api/api-client';
import { Comment } from '../models/comment';

export async function getAll(slug: string): Promise<Comment[]> {
  const { data } = await api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  return data.comments;
}

export async function add(slug: string, payload: string): Promise<Comment> {
  const { data } = await api.post<{ comment: Comment }>(`/articles/${slug}/comments`, {
    comment: { body: payload },
  });
  return data.comment;
}

export async function deleteComment(commentId: string, slug: string): Promise<void> {
  await api.delete<void>(`/articles/${slug}/comments/${commentId}`);
}
