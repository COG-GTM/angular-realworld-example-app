import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiInterceptor } from './api.interceptor';
import { tokenInterceptor } from './token.interceptor';
import { errorInterceptor } from './error.interceptor';
import { JwtService } from '../auth/services/jwt.service';
import { UserService } from '../auth/services/user.service';

describe('interceptors', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  describe('apiInterceptor', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
      });
    });

    it('should prefix requests with the API url', () => {
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);

      http.get('/tags').subscribe();

      const req = httpMock.expectOne('https://api.realworld.show/api/tags');
      req.flush({ tags: [] });
    });
  });

  describe('tokenInterceptor', () => {
    let jwtService: { getToken: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      jwtService = { getToken: vi.fn() };
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([tokenInterceptor])),
          provideHttpClientTesting(),
          { provide: JwtService, useValue: jwtService },
        ],
      });
    });

    it('should add Authorization header when token exists', () => {
      jwtService.getToken.mockReturnValue('my-token');
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);

      http.get('/articles').subscribe();

      const req = httpMock.expectOne('/articles');
      expect(req.request.headers.get('Authorization')).toBe('Token my-token');
      req.flush({});
    });

    it('should not add Authorization header when no token', () => {
      jwtService.getToken.mockReturnValue(null);
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);

      http.get('/articles').subscribe();

      const req = httpMock.expectOne('/articles');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('errorInterceptor', () => {
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
    });

    it('should pass through successful responses', () => {
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);
      let result: unknown;

      http.get('/articles').subscribe(res => (result = res));
      httpMock.expectOne('/articles').flush({ ok: true });

      expect(result).toEqual({ ok: true });
      expect(userService.purgeAuth).not.toHaveBeenCalled();
    });

    it('should purge auth on 401 for non-/user endpoints', () => {
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);
      let error: any;

      http.get('/articles').subscribe({ error: err => (error = err) });
      httpMock
        .expectOne('/articles')
        .flush({ errors: { token: ['is invalid'] } }, { status: 401, statusText: 'Unauthorized' });

      expect(userService.purgeAuth).toHaveBeenCalled();
      expect(error.status).toBe(401);
      expect(error.errors).toEqual({ token: ['is invalid'] });
    });

    it('should not purge auth on 401 for /user endpoint', () => {
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);
      let error: any;

      http.get('/user').subscribe({ error: err => (error = err) });
      httpMock
        .expectOne('/user')
        .flush({ errors: { token: ['expired'] } }, { status: 401, statusText: 'Unauthorized' });

      expect(userService.purgeAuth).not.toHaveBeenCalled();
      expect(error.status).toBe(401);
    });

    it('should provide fallback network error message when body has no errors', () => {
      const http = TestBed.inject(HttpClient);
      const httpMock = TestBed.inject(HttpTestingController);
      let error: any;

      http.get('/articles').subscribe({ error: err => (error = err) });
      httpMock.expectOne('/articles').error(new ProgressEvent('error'), { status: 0 });

      expect(error.status).toBe(0);
      expect(error.errors.network).toBeDefined();
    });
  });
});
