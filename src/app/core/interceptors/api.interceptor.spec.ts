import { initTestBed } from '../../../testing/setup-test-bed';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  beforeAll(() => {
    initTestBed();
  });

  it('should prefix the request url with the api base url', () => {
    const req = new HttpRequest('GET', '/articles');
    const next: HttpHandlerFn = vi.fn((r: HttpRequest<unknown>) => of({} as HttpEvent<unknown>));

    apiInterceptor(req, next);

    expect(next).toHaveBeenCalledTimes(1);
    const forwarded = (next as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwarded.url).toBe('https://api.realworld.show/api/articles');
  });

  it('should not mutate the original request', () => {
    const req = new HttpRequest('GET', '/tags');
    const next: HttpHandlerFn = vi.fn((r: HttpRequest<unknown>) => of({} as HttpEvent<unknown>));

    apiInterceptor(req, next);

    expect(req.url).toBe('/tags');
  });
});
