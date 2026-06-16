import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ROOT } from '../api/apiClient';
import { articlesService } from './articles';
import type { Article } from '../types/article';

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'Test description',
  body: 'Test body content',
  tagList: ['test', 'react'],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
  favorited: false,
  favoritesCount: 5,
  author: { username: 'testuser', bio: 'Test bio', image: 'https://example.com/avatar.jpg', following: false },
};

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('articlesService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries the global feed with filters', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [mockArticle], articlesCount: 1 }));

    const result = await articlesService.query({ type: 'all', filters: { tag: 'react', limit: 10, offset: 0 } });

    expect(result.articlesCount).toBe(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`${API_ROOT}/articles?`);
    expect(url).toContain('tag=react');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=0');
  });

  it('queries the personal feed when type is feed', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ articles: [], articlesCount: 0 }));

    await articlesService.query({ type: 'feed', filters: {} });

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_ROOT}/articles/feed`);
  });

  it('gets a single article by slug', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ article: mockArticle }));

    const article = await articlesService.get('test-article');

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_ROOT}/articles/test-article`);
    expect(article).toEqual(mockArticle);
  });

  it('creates an article via POST /articles/', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ article: mockArticle }));

    const payload = { title: 'Test Article', description: 'd', body: 'b', tagList: ['test'] };
    await articlesService.create(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_ROOT}/articles/`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ article: payload });
  });

  it('favorites an article', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ article: { ...mockArticle, favorited: true } }));

    const article = await articlesService.favorite('test-article');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_ROOT}/articles/test-article/favorite`);
    expect(init.method).toBe('POST');
    expect(article.favorited).toBe(true);
  });
});
