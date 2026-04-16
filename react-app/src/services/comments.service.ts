import { api } from './api';
import { Comment } from '../models/comment';

export async function getComments(slug: string): Promise<Comment[]> {
  const data = await api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  return data.comments;
}

export async function addComment(slug: string, body: string): Promise<Comment> {
  const data = await api.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } });
  return data.comment;
}

export async function deleteComment(slug: string, commentId: string): Promise<void> {
  await api.del<void>(`/articles/${slug}/comments/${commentId}`);
}
