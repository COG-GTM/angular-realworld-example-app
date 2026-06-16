import { describe, expect, it } from 'vitest';
import * as articles from './articles';
import { fakeResponse, mockFetch } from '../test/fetchMock';
import type { Article } from '../types/article';

const BASE = 'https://api.realworld.show/api';

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'desc',
  body: 'body',
  tagList: ['a'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  favorited: false,
  favoritesCount: 5,
  author: { username: 'u', bio: null, image: null, following: false },
};

describe('articles api', () => {
  it('queries the global list with filters', async () => {
    const fetchFn = mockFetch(() =>
      Promise.resolve(fakeResponse({ body: { articles: [mockArticle], articlesCount: 1 } })),
    );
    const res = await articles.query({ type: 'all', filters: { tag: 'ng', limit: 10, offset: 0 } });
    expect(res.articlesCount).toBe(1);
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url.startsWith(`${BASE}/articles?`)).toBe(true);
    expect(url).toContain('tag=ng');
  });

  it('queries the feed when type is feed', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { articles: [], articlesCount: 0 } })));
    await articles.query({ type: 'feed', filters: {} });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/feed`);
  });

  it('gets a single article and unwraps it', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ body: { article: mockArticle } })));
    await expect(articles.get('test-article')).resolves.toEqual(mockArticle);
  });

  it('creates an article via POST /articles/ (trailing slash)', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { article: mockArticle } })));
    await articles.create({ title: 'x' });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/`);
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('POST');
  });

  it('updates an article via PUT /articles/:slug', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { article: mockArticle } })));
    await articles.update({ slug: 'test-article', title: 'New' });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/test-article`);
    expect((fetchFn.mock.calls[0][1] as RequestInit).method).toBe('PUT');
  });

  it('deletes an article (accepts empty 204 body)', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 204, text: '' })));
    await expect(articles.del('test-article')).resolves.toBeUndefined();
  });

  it('favorites and unfavorites', async () => {
    const fetchFn = mockFetch(() =>
      Promise.resolve(fakeResponse({ body: { article: { ...mockArticle, favorited: true } } })),
    );
    const fav = await articles.favorite('test-article');
    expect(fav.favorited).toBe(true);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/articles/test-article/favorite`);

    mockFetch(() => Promise.resolve(fakeResponse({ status: 204, text: '' })));
    await expect(articles.unfavorite('test-article')).resolves.toBeUndefined();
  });

  it('propagates errors with status', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 404, body: { errors: { article: ['not found'] } } })));
    await expect(articles.get('missing')).rejects.toMatchObject({ status: 404 });
  });
});
