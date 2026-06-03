import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { initTestBed } from '../../../testing/setup-test-bed';
import { tokenInterceptor } from './token.interceptor';
import { JwtService } from '../auth/services/jwt.service';

describe('tokenInterceptor', () => {
  let jwtService: { getToken: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    jwtService = { getToken: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: JwtService, useValue: jwtService }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function run(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const next: HttpHandlerFn = vi.fn((r: HttpRequest<unknown>) => of({} as HttpEvent<unknown>));
    TestBed.runInInjectionContext(() => tokenInterceptor(req, next));
    return (next as any).mock.calls[0][0] as HttpRequest<unknown>;
  }

  it('should add an Authorization header when a token exists', () => {
    jwtService.getToken.mockReturnValue('abc123');
    const forwarded = run(new HttpRequest('GET', '/user'));
    expect(forwarded.headers.get('Authorization')).toBe('Token abc123');
  });

  it('should not add an Authorization header when there is no token', () => {
    jwtService.getToken.mockReturnValue(undefined);
    const forwarded = run(new HttpRequest('GET', '/user'));
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('should not add an Authorization header for an empty token', () => {
    jwtService.getToken.mockReturnValue('');
    const forwarded = run(new HttpRequest('GET', '/user'));
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });
});
