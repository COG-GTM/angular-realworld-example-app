import { describe, expect, it } from 'vitest';
import * as comments from './comments';
import { fakeResponse, mockFetch } from '../test/fetchMock';
import type { Comment } from '../types/comment';

const BASE = 'https://api.realworld.show/api';
const mockComment: Comment = {
  id: 1,
  body: 'hi',
  createdAt: '2024-01-01',
  author: { username: 'u', bio: null, image: null, following: false },
};

describe('comments api', () => {
  it('lists comments', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { comments: [mockComment] } })));
    await expect(comments.getAll('slug')).resolves.toEqual([mockComment]);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/slug/comments`);
  });

  it('adds a comment with the {comment:{body}} payload', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { comment: mockComment } })));
    await comments.add('slug', 'hello');
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ comment: { body: 'hello' } }));
  });

  it('deletes a comment via DELETE (accepts a 200 body)', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ status: 200, body: {} })));
    await expect(comments.del('slug', 1)).resolves.not.toThrow();
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/slug/comments/1`);
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('DELETE');
  });

  it('deletes a comment with an empty 204 body', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 204, text: '' })));
    await expect(comments.del('slug', 1)).resolves.toBeUndefined();
  });
});
