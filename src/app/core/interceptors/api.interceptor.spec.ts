import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL, apiInterceptor } from './api.interceptor';
import { environment } from '../../../environments/environment';

function setup(apiUrl?: string) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([apiInterceptor])),
      provideHttpClientTesting(),
      ...(apiUrl === undefined ? [] : [{ provide: API_URL, useValue: apiUrl }]),
    ],
  });
  return { http: TestBed.inject(HttpClient), httpMock: TestBed.inject(HttpTestingController) };
}

describe('apiInterceptor', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('prefixes requests with the environment apiUrl by default', () => {
    const { http, httpMock } = setup();
    http.get('/tags').subscribe();
    httpMock.expectOne(`${environment.apiUrl}/tags`).flush({ tags: [] });
  });

  it('prefixes requests with a provided API_URL', () => {
    const { http, httpMock } = setup('/api');
    http.get('/articles?limit=10').subscribe();
    httpMock.expectOne('/api/articles?limit=10').flush({ articles: [], articlesCount: 0 });
  });

  it('supports an absolute backend URL', () => {
    const { http, httpMock } = setup('http://backend:8080');
    http.post('/users/login', {}).subscribe();
    const req = httpMock.expectOne('http://backend:8080/users/login');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
