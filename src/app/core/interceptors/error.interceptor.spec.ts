import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { UserService } from '../auth/services/user.service';
import { ToastService } from '../notifications/toast.service';
import { ApiError } from '../models/errors.model';
import { NETWORK_ERROR_MESSAGE, SERVER_ERROR_MESSAGE, SESSION_EXPIRED_MESSAGE } from '../errors/error-messages';

describe('errorInterceptor', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toastService: ToastService;
  let userService: { purgeAuth: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userService = { purgeAuth: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpMock.verify();
    toastService.clear();
    TestBed.resetTestingModule();
  });

  function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string): Promise<ApiError> {
    return firstValueFrom(http.request(method, url)).then(
      () => {
        throw new Error('expected request to fail');
      },
      (err: ApiError) => err,
    );
  }

  const toastMessages = () => toastService.toasts().map(t => t.message);

  describe('error normalization', () => {
    it('passes through the server error body with the status', async () => {
      const result = request('POST', '/users/login');
      httpMock
        .expectOne('/users/login')
        .flush({ errors: { 'email or password': ['is invalid'] } }, { status: 422, statusText: 'Unprocessable' });

      expect(await result).toEqual({ errors: { 'email or password': ['is invalid'] }, status: 422 });
    });

    it('substitutes a network message when the request never reached the server', async () => {
      const result = request('POST', '/articles');
      httpMock.expectOne('/articles').error(new ProgressEvent('error'), { status: 0 });

      expect(await result).toEqual({ errors: { network: [NETWORK_ERROR_MESSAGE] }, status: 0 });
    });

    it('substitutes a network message when the error body is not in RealWorld format', async () => {
      const result = request('PUT', '/articles/slug');
      httpMock
        .expectOne('/articles/slug')
        .flush('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' });

      const err = await result;
      expect(err.status).toBe(502);
      expect(err.errors).toEqual({ network: [NETWORK_ERROR_MESSAGE] });
    });
  });

  describe('global toasts', () => {
    it('toasts and flags 5XX errors on GET requests', async () => {
      const result = request('GET', '/articles');
      httpMock
        .expectOne('/articles')
        .flush({ errors: { body: ['boom'] } }, { status: 500, statusText: 'Server Error' });

      const err = await result;
      expect(err.notified).toBe(true);
      expect(toastMessages()).toEqual([SERVER_ERROR_MESSAGE]);
    });

    it('toasts and flags network errors on GET requests', async () => {
      const result = request('GET', '/tags');
      httpMock.expectOne('/tags').error(new ProgressEvent('error'), { status: 0 });

      expect((await result).notified).toBe(true);
      expect(toastMessages()).toEqual([NETWORK_ERROR_MESSAGE]);
    });

    it('shows a single toast when several GETs fail with the same error', async () => {
      const a = request('GET', '/articles');
      const b = request('GET', '/tags');
      httpMock.expectOne('/articles').flush(null, { status: 503, statusText: 'Unavailable' });
      httpMock.expectOne('/tags').flush(null, { status: 503, statusText: 'Unavailable' });
      await Promise.all([a, b]);

      expect(toastMessages()).toEqual([SERVER_ERROR_MESSAGE]);
    });

    it.each(['POST', 'PUT', 'DELETE'] as const)('leaves 5XX/network errors on %s to the caller', async method => {
      const result = request(method, '/articles/slug');
      httpMock.expectOne('/articles/slug').flush(null, { status: 500, statusText: 'Server Error' });

      expect((await result).notified).toBeUndefined();
      expect(toastService.toasts()).toHaveLength(0);
    });

    it('leaves non-auth 4XX errors on GET to the caller', async () => {
      const result = request('GET', '/articles/missing');
      httpMock
        .expectOne('/articles/missing')
        .flush({ errors: { article: ['not found'] } }, { status: 404, statusText: 'Not Found' });

      const err = await result;
      expect(err.notified).toBeUndefined();
      expect(toastService.toasts()).toHaveLength(0);
    });
  });

  describe('401 handling', () => {
    it('logs out and toasts on 401 from a regular endpoint', async () => {
      const result = request('POST', '/articles/slug/favorite');
      httpMock
        .expectOne('/articles/slug/favorite')
        .flush({ errors: { message: ['Unauthorized'] } }, { status: 401, statusText: 'Unauthorized' });

      const err = await result;
      expect(userService.purgeAuth).toHaveBeenCalledTimes(1);
      expect(err.notified).toBe(true);
      expect(toastMessages()).toEqual([SESSION_EXPIRED_MESSAGE]);
    });

    it.each(['GET', 'PUT'] as const)('does not log out or toast on 401 from %s /user', async method => {
      const result = request(method, '/user');
      httpMock
        .expectOne('/user')
        .flush({ errors: { token: ['invalid'] } }, { status: 401, statusText: 'Unauthorized' });

      const err = await result;
      expect(err.status).toBe(401);
      expect(userService.purgeAuth).not.toHaveBeenCalled();
      expect(toastService.toasts()).toHaveLength(0);
    });

    it('does not toast 5XX from GET /user (UserService shows the unavailable state)', async () => {
      const result = request('GET', '/user');
      httpMock.expectOne('/user').flush(null, { status: 503, statusText: 'Unavailable' });

      await result;
      expect(toastService.toasts()).toHaveLength(0);
    });
  });
});
