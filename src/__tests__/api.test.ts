import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API agent', () => {
  it('includes Authorization header when token exists', async () => {
    localStorage.setItem('jwtToken', 'test-token');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ tags: [] }),
    });

    const { getTags } = await import('../api');
    await getTags();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.realworld.show/api/tags',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token test-token',
        }),
      }),
    );
  });

  it('omits Authorization header when no token', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ tags: ['test'] }),
    });

    const { getTags } = await import('../api');
    await getTags();

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws error body on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ errors: { email: 'has already been taken' } }),
    });

    const { getTags } = await import('../api');
    await expect(getTags()).rejects.toEqual(expect.objectContaining({ status: 422 }));
  });
});

describe('Articles API', () => {
  it('queryArticles builds correct URL with filters', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ articles: [], articlesCount: 0 }),
    });

    const { queryArticles } = await import('../api');
    await queryArticles({
      type: 'all',
      filters: { tag: 'react', limit: 10, offset: 0 },
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/articles?');
    expect(url).toContain('tag=react');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=0');
  });

  it('queryArticles uses /articles/feed for feed type', async () => {
    localStorage.setItem('jwtToken', 'test-token');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ articles: [], articlesCount: 0 }),
    });

    const { queryArticles } = await import('../api');
    await queryArticles({ type: 'feed', filters: {} });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('/articles/feed');
  });
});

describe('Auth API', () => {
  it('login saves token to localStorage', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          user: {
            email: 'test@test.com',
            token: 'jwt-123',
            username: 'testuser',
            bio: null,
            image: null,
          },
        }),
    });

    const { login } = await import('../api');
    const user = await login({ email: 'test@test.com', password: 'pass' });

    expect(user.token).toBe('jwt-123');
    expect(localStorage.getItem('jwtToken')).toBe('jwt-123');
  });
});
