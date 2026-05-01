import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './error.interceptor';
import { UserService } from '../auth/services/user.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockUserService: { purgeAuth: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockUserService = {
      purgeAuth: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should pass through successful responses', () => {
    let result: unknown;
    httpClient.get('/articles').subscribe(res => (result = res));
    httpMock.expectOne('/articles').flush({ articles: [] });
    expect(result).toEqual({ articles: [] });
  });

  it('should call purgeAuth on 401 for non-user endpoints', () => {
    httpClient.get('/articles').subscribe({ error: () => {} });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { auth: ['unauthorized'] } }, { status: 401, statusText: 'Unauthorized' });
    expect(mockUserService.purgeAuth).toHaveBeenCalled();
  });

  it('should not call purgeAuth on 401 for /user endpoint', () => {
    httpClient.get('/user').subscribe({ error: () => {} });
    httpMock
      .expectOne('/user')
      .flush({ errors: { auth: ['unauthorized'] } }, { status: 401, statusText: 'Unauthorized' });
    expect(mockUserService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should normalize error format with errors body', () => {
    let error: any;
    httpClient.get('/articles').subscribe({ error: err => (error = err) });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { title: ['is required'] } }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(error.errors).toEqual({ title: ['is required'] });
    expect(error.status).toBe(422);
  });

  it('should provide fallback error for network errors', () => {
    let error: any;
    httpClient.get('/articles').subscribe({ error: err => (error = err) });
    httpMock.expectOne('/articles').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    expect(error.errors.network).toBeTruthy();
    expect(error.status).toBe(0);
  });

  it('should not call purgeAuth for 403 errors', () => {
    httpClient.get('/articles').subscribe({ error: () => {} });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { auth: ['forbidden'] } }, { status: 403, statusText: 'Forbidden' });
    expect(mockUserService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should not call purgeAuth for 500 errors', () => {
    httpClient.get('/articles').subscribe({ error: () => {} });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { server: ['internal error'] } }, { status: 500, statusText: 'Internal Server Error' });
    expect(mockUserService.purgeAuth).not.toHaveBeenCalled();
  });
});
