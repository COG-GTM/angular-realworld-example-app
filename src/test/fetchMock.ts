import { vi } from 'vitest';

export interface FakeResponseInit {
  status?: number;
  ok?: boolean;
  body?: unknown;
  /** Raw text body; takes precedence over `body` when provided. */
  text?: string;
}

/** Builds a minimal `Response`-like object sufficient for `apiFetch`. */
export function fakeResponse({ status = 200, ok, body, text }: FakeResponseInit = {}): Response {
  const resolvedText = text !== undefined ? text : body !== undefined ? JSON.stringify(body) : '';
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    text: () => Promise.resolve(resolvedText),
  } as unknown as Response;
}

/** Installs a `vi.fn()` on `global.fetch` and returns it. */
export function mockFetch(impl?: (url: string, init?: RequestInit) => Promise<Response>) {
  const fn = vi.fn(impl ?? (() => Promise.resolve(fakeResponse())));
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}
