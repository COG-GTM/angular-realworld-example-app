import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should prepend API base URL to requests', () => {
    httpClient.get('/articles').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles');
    expect(req.request.url).toBe('https://api.realworld.show/api/articles');
    req.flush([]);
  });

  it('should prepend API base URL to user endpoint', () => {
    httpClient.get('/user').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/user');
    expect(req.request.url).toBe('https://api.realworld.show/api/user');
    req.flush({});
  });

  it('should preserve query parameters', () => {
    httpClient.get('/articles', { params: { tag: 'angular' } }).subscribe();
    const req = httpMock.expectOne(r => r.url === 'https://api.realworld.show/api/articles');
    expect(req.request.params.get('tag')).toBe('angular');
    req.flush([]);
  });

  it('should preserve request method', () => {
    httpClient.post('/articles', { title: 'test' }).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should preserve request body', () => {
    const body = { article: { title: 'Test' } };
    httpClient.post('/articles', body).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });
});
