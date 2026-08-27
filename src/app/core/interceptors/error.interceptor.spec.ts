import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { UserService } from '../auth/services/user.service';

describe('errorInterceptor', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let http: HttpClient;
  let httpMock: HttpTestingController;
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
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should pass through successful responses untouched', () => {
    let result: unknown;
    http.get('/articles').subscribe(res => (result = res));
    httpMock.expectOne('/articles').flush({ articles: [] });
    expect(result).toEqual({ articles: [] });
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should purge auth on 401 from non-/user endpoints', () => {
    let error: any;
    http.get('/articles').subscribe({ error: e => (error = e) });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { token: ['expired'] } }, { status: 401, statusText: 'Unauthorized' });
    expect(userService.purgeAuth).toHaveBeenCalledTimes(1);
    expect(error.status).toBe(401);
    expect(error.errors).toEqual({ token: ['expired'] });
  });

  it('should NOT purge auth on 401 from the /user endpoint', () => {
    let error: any;
    http.get('/user').subscribe({ error: e => (error = e) });
    httpMock.expectOne('/user').flush({ errors: { token: ['invalid'] } }, { status: 401, statusText: 'Unauthorized' });
    expect(userService.purgeAuth).not.toHaveBeenCalled();
    expect(error.status).toBe(401);
  });

  it('should not purge auth for non-401 errors', () => {
    let error: any;
    http.get('/articles').subscribe({ error: e => (error = e) });
    httpMock
      .expectOne('/articles')
      .flush({ errors: { server: ['boom'] } }, { status: 500, statusText: 'Server Error' });
    expect(userService.purgeAuth).not.toHaveBeenCalled();
    expect(error.status).toBe(500);
    expect(error.errors).toEqual({ server: ['boom'] });
  });

  it('should re-throw error body with status attached', () => {
    let error: any;
    http.post('/users/login', {}).subscribe({ error: e => (error = e) });
    httpMock
      .expectOne('/users/login')
      .flush({ errors: { 'email or password': ['is invalid'] } }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(error).toEqual({ errors: { 'email or password': ['is invalid'] }, status: 422 });
  });

  it('should provide a network fallback message when error body has no errors key', () => {
    let error: any;
    http.get('/articles').subscribe({ error: e => (error = e) });
    httpMock.expectOne('/articles').error(new ProgressEvent('error'));
    expect(error.status).toBe(0);
    expect(error.errors).toEqual({ network: ['Unable to connect. Please check your internet connection.'] });
  });

  it('should provide a network fallback message when error body is not an object', () => {
    let error: any;
    http.get('/articles').subscribe({ error: e => (error = e) });
    httpMock.expectOne('/articles').flush('plain text error', { status: 500, statusText: 'Server Error' });
    expect(error.errors).toEqual({ network: ['Unable to connect. Please check your internet connection.'] });
    expect(error.status).toBe(500);
  });
});
