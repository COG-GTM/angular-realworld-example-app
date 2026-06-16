import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, setUnauthorizedHandler } from './client';
import { saveToken } from './jwt';
import { fakeResponse, mockFetch } from '../test/fetchMock';

const BASE = 'https://api.realworld.show/api';

afterEach(() => {
  setUnauthorizedHandler(() => {});
});

describe('apiFetch', () => {
  it('prepends the API base URL', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { ok: true } })));
    await apiFetch('/tags');
    expect(fetchFn).toHaveBeenCalledWith(`${BASE}/tags`, expect.any(Object));
  });

  it('serializes query params (skipping undefined)', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: {} })));
    await apiFetch('/articles', { query: { tag: 'ng', limit: 10, author: undefined } });
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain('tag=ng');
    expect(url).toContain('limit=10');
    expect(url).not.toContain('author');
  });

  it('attaches the Authorization header when a token exists', async () => {
    saveToken('my-token');
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: {} })));
    await apiFetch('/user');
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Token my-token');
  });

  it('omits the Authorization header when no token exists', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: {} })));
    await apiFetch('/user');
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('sends a JSON body with content-type for writes', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: {} })));
    await apiFetch('/articles', { method: 'POST', body: { article: { title: 't' } } });
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ article: { title: 't' } }));
  });

  it('parses a JSON success body', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ body: { value: 42 } })));
    await expect(apiFetch<{ value: number }>('/x')).resolves.toEqual({ value: 42 });
  });

  it('resolves to undefined for an empty / 204 body', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 204, text: '' })));
    await expect(apiFetch('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('preserves an error body containing `errors` and attaches status', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 422, body: { errors: { email: ['is taken'] } } })));
    await expect(apiFetch('/users')).rejects.toMatchObject({
      status: 422,
      errors: { email: ['is taken'] },
    });
  });

  it('falls back to a network message for non-error-shaped bodies', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 500, body: { message: 'boom' } })));
    await expect(apiFetch('/x')).rejects.toMatchObject({
      status: 500,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });

  it('produces a network error (status 0) when fetch rejects', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(apiFetch('/x')).rejects.toMatchObject({
      status: 0,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });

  it('treats malformed JSON on a 2xx as a network error', async () => {
    mockFetch(() => Promise.resolve(fakeResponse({ status: 200, text: '{ not json }}}' })));
    await expect(apiFetch('/user')).rejects.toMatchObject({ status: 200 });
  });

  it('calls the unauthorized handler on 401 for non-/user endpoints', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch(() => Promise.resolve(fakeResponse({ status: 401, body: { errors: {} } })));
    await expect(apiFetch('/articles/x/favorite', { method: 'POST', body: {} })).rejects.toBeTruthy();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does NOT call the unauthorized handler on 401 for /user', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch(() => Promise.resolve(fakeResponse({ status: 401, body: { errors: {} } })));
    await expect(apiFetch('/user')).rejects.toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });
});
