import { describe, it, expect, vi, afterEach } from 'vitest';

describe('ArticlesService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should query articles with correct URL params', async () => {
    const mockArticles = { articles: [], articlesCount: 0 };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockArticles),
    });
    globalThis.fetch = mockFetch;

    const { queryArticles } = await import('./articles.service');
    const result = await queryArticles({ type: 'all', filters: { tag: 'react', limit: 10, offset: 0 } });

    expect(result).toEqual(mockArticles);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/articles?'), expect.any(Object));
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('tag=react');
    expect(url).toContain('limit=10');
  });

  it('should query feed articles when type is feed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ articles: [], articlesCount: 0 }),
    });
    globalThis.fetch = mockFetch;

    const { queryArticles } = await import('./articles.service');
    await queryArticles({ type: 'feed', filters: {} });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/articles/feed');
  });

  it('should throw on HTTP error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ errors: { error: 'Unauthorized' } }),
    });
    globalThis.fetch = mockFetch;

    const { queryArticles } = await import('./articles.service');
    await expect(queryArticles({ type: 'all', filters: {} })).rejects.toBeDefined();
  });
});
