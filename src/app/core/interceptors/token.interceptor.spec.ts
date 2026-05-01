import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './token.interceptor';
import { JwtService } from '../auth/services/jwt.service';

describe('tokenInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockJwtService: { getToken: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockJwtService = {
      getToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: JwtService, useValue: mockJwtService },
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

  it('should add Authorization header when token exists', () => {
    mockJwtService.getToken.mockReturnValue('test-token-123');
    httpClient.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Token test-token-123');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    mockJwtService.getToken.mockReturnValue(null);
    httpClient.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header when token is empty string', () => {
    mockJwtService.getToken.mockReturnValue('');
    httpClient.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should preserve other request headers', () => {
    mockJwtService.getToken.mockReturnValue('my-token');
    httpClient.get('/test', { headers: { 'X-Custom': 'value' } }).subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Token my-token');
    expect(req.request.headers.get('X-Custom')).toBe('value');
    req.flush({});
  });
});
