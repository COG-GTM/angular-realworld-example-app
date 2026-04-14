import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
    req.flush({});
  });

  it('should prepend API base URL to POST requests', () => {
    httpClient.post('/users/login', {}).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/users/login');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should prepend API base URL to PUT requests', () => {
    httpClient.put('/user', {}).subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/user');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should prepend API base URL to DELETE requests', () => {
    httpClient.delete('/articles/test-slug').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles/test-slug');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should handle nested paths', () => {
    httpClient.get('/articles/test/comments').subscribe();
    const req = httpMock.expectOne('https://api.realworld.show/api/articles/test/comments');
    expect(req.request.url).toBe('https://api.realworld.show/api/articles/test/comments');
    req.flush({});
  });
});
