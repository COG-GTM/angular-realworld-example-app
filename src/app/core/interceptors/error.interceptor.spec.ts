import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../auth/services/user.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let userService: { purgeAuth: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    userService = { purgeAuth: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should pass through successful responses', () => {
    httpClient.get('/test').subscribe(response => {
      expect(response).toEqual({ data: 'success' });
    });
    const req = httpMock.expectOne('/test');
    req.flush({ data: 'success' });
  });

  it('should call purgeAuth on 401 for non-/user endpoints', async () => {
    const promise = firstValueFrom(httpClient.get('/articles'));
    const req = httpMock.expectOne('/articles');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    try {
      await promise;
    } catch {
      // expected
    }
    expect(userService.purgeAuth).toHaveBeenCalled();
  });

  it('should NOT call purgeAuth on 401 for /user endpoint', async () => {
    const promise = firstValueFrom(httpClient.get('/user'));
    const req = httpMock.expectOne('/user');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    try {
      await promise;
    } catch {
      // expected
    }
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should not call purgeAuth for non-401 errors', async () => {
    const promise = firstValueFrom(httpClient.get('/articles'));
    const req = httpMock.expectOne('/articles');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });
    try {
      await promise;
    } catch {
      // expected
    }
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should propagate error body with errors property', async () => {
    const errorBody = { errors: { email: ['is invalid'] } };
    const promise = firstValueFrom(httpClient.get('/test'));
    const req = httpMock.expectOne('/test');
    req.flush(errorBody, { status: 422, statusText: 'Unprocessable Entity' });
    try {
      await promise;
    } catch (err: any) {
      expect(err.errors).toEqual({ email: ['is invalid'] });
      expect(err.status).toBe(422);
    }
  });

  it('should provide fallback error message for network errors', async () => {
    const promise = firstValueFrom(httpClient.get('/test'));
    const req = httpMock.expectOne('/test');
    req.flush('not an object', { status: 0, statusText: 'Unknown Error' });
    try {
      await promise;
    } catch (err: any) {
      expect(err.errors.network).toBeDefined();
      expect(err.status).toBe(0);
    }
  });

  it('should provide fallback for error without errors property', async () => {
    const promise = firstValueFrom(httpClient.get('/test'));
    const req = httpMock.expectOne('/test');
    req.flush('plain string error', { status: 500, statusText: 'Server Error' });
    try {
      await promise;
    } catch (err: any) {
      expect(err.errors.network).toBeDefined();
      expect(err.status).toBe(500);
    }
  });

  it('should handle 403 errors without calling purgeAuth', async () => {
    const promise = firstValueFrom(httpClient.get('/articles'));
    const req = httpMock.expectOne('/articles');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    try {
      await promise;
    } catch {
      // expected
    }
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });
});
