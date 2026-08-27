import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { tokenInterceptor } from './token.interceptor';
import { JwtService } from '../auth/services/jwt.service';

describe('tokenInterceptor', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let http: HttpClient;
  let httpMock: HttpTestingController;
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
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should add Authorization header when a token exists', () => {
    jwtService.getToken.mockReturnValue('my-jwt-token');
    http.get('/articles').subscribe();
    const req = httpMock.expectOne('/articles');
    expect(req.request.headers.get('Authorization')).toBe('Token my-jwt-token');
    req.flush({});
  });

  it('should not add Authorization header when no token exists', () => {
    jwtService.getToken.mockReturnValue(null);
    http.get('/articles').subscribe();
    const req = httpMock.expectOne('/articles');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header for empty string token', () => {
    jwtService.getToken.mockReturnValue('');
    http.get('/articles').subscribe();
    const req = httpMock.expectOne('/articles');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach the token to every request method', () => {
    jwtService.getToken.mockReturnValue('abc');
    http.post('/articles', {}).subscribe();
    const postReq = httpMock.expectOne('/articles');
    expect(postReq.request.headers.get('Authorization')).toBe('Token abc');
    postReq.flush({});

    http.delete('/articles/slug').subscribe();
    const deleteReq = httpMock.expectOne('/articles/slug');
    expect(deleteReq.request.headers.get('Authorization')).toBe('Token abc');
    deleteReq.flush({});
  });

  it('should read the token on each request (fresh token after login)', () => {
    jwtService.getToken.mockReturnValueOnce(null).mockReturnValueOnce('new-token');
    http.get('/a').subscribe();
    const first = httpMock.expectOne('/a');
    expect(first.request.headers.has('Authorization')).toBe(false);
    first.flush({});

    http.get('/b').subscribe();
    const second = httpMock.expectOne('/b');
    expect(second.request.headers.get('Authorization')).toBe('Token new-token');
    second.flush({});
  });
});
