import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should prefix relative URLs with the API base URL', () => {
    http.get('/articles').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles');
    expect(req.request.url).toBe('https://api.realworld.show/api/articles');
    req.flush({});
  });

  it('should preserve the request method', () => {
    http.post('/users/login', { user: {} }).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/users/login');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should preserve the request body', () => {
    const body = { user: { email: 'a@b.c', password: 'pw' } };
    http.post('/users', body).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/users');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('should prefix nested paths', () => {
    http.delete('/articles/some-slug/comments/1').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles/some-slug/comments/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should preserve query parameters', () => {
    http.get('/articles', { params: { limit: '10', offset: '0' } }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'https://api.realworld.show/api/articles');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({});
  });
});
