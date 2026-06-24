import type { Comment } from '../types';
import { requests } from './agent';

export async function getComments(slug: string): Promise<Comment[]> {
  const data = await requests.get<{ comments: Comment[] }>(`/articles/${slug}/comments`);
  return data.comments;
}

export async function addComment(slug: string, body: string): Promise<Comment> {
  const data = await requests.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } });
  return data.comment;
}

export async function deleteComment(commentId: string, slug: string): Promise<void> {
  await requests.del(`/articles/${slug}/comments/${commentId}`);
}
