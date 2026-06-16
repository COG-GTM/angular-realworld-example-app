import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_ROOT, apiClient, setUnauthorizedHandler } from './apiClient';

function mockResponse(body: string, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes the API root and parses JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse(JSON.stringify({ tags: ['a'] }), { ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiClient.get<{ tags: string[] }>('/tags');

    expect(fetchMock).toHaveBeenCalledWith(`${API_ROOT}/tags`, expect.objectContaining({ method: 'GET' }));
    expect(data).toEqual({ tags: ['a'] });
  });

  it('adds the Authorization header when a token is stored', async () => {
    window.localStorage.setItem('jwtToken', 'tok123');
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('{}', { ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.get('/user');

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Token tok123');
  });

  it('appends query params', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockResponse('{"articles":[],"articlesCount":0}', { ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.get('/articles', { params: { tag: 'x', limit: 10, offset: undefined } });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe(`${API_ROOT}/articles?tag=x&limit=10`);
  });

  it('normalizes API errors to { ...body, status }', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockResponse(JSON.stringify({ errors: { email: ['is invalid'] } }), { ok: false, status: 422 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.post('/users/login', {})).rejects.toEqual({
      errors: { email: ['is invalid'] },
      status: 422,
    });
  });

  it('uses a network fallback message on connection failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/articles')).rejects.toMatchObject({
      status: 0,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });

  it('invokes the unauthorized handler on a 401 for non-/user endpoints', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('{}', { ok: false, status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.post('/articles/test/favorite', {})).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke the unauthorized handler on a 401 for /user', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('{}', { ok: false, status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.put('/user', {})).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('treats an empty 2xx body as undefined (e.g. 204 on DELETE)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse('', { ok: true, status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.del('/articles/test')).resolves.toBeUndefined();
  });
});
