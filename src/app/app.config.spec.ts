import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { EMPTY, of } from 'rxjs';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { appConfig, initAuth, ConduitDebug } from './app.config';
import { JwtService } from './core/auth/services/jwt.service';
import { UserService } from './core/auth/services/user.service';

describe('appConfig', () => {
  it('should have providers configured', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('should have 4 providers (zoneless, router, httpClient, appInitializer)', () => {
    expect(appConfig.providers.length).toBe(4);
  });
});

describe('initAuth', () => {
  let jwtService: { getToken: ReturnType<typeof vi.fn> };
  let userService: {
    getCurrentUser: ReturnType<typeof vi.fn>;
    purgeAuth: ReturnType<typeof vi.fn>;
    authState: any;
    currentUser: any;
  };

  beforeEach(() => {
    jwtService = { getToken: vi.fn() };
    userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({})),
      purgeAuth: vi.fn(),
      authState: of('loading'),
      currentUser: of(null),
    };

    // Mock window for debug interface
    (window as any).__conduit_debug__ = undefined;
  });

  afterEach(() => {
    delete (window as any).__conduit_debug__;
  });

  it('should return a function', () => {
    const init = initAuth(jwtService as any, userService as any);
    expect(typeof init).toBe('function');
  });

  it('should call getCurrentUser when token exists', () => {
    jwtService.getToken.mockReturnValue('valid-token');
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(userService.getCurrentUser).toHaveBeenCalled();
  });

  it('should call purgeAuth when no token exists', () => {
    jwtService.getToken.mockReturnValue(null);
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(userService.purgeAuth).toHaveBeenCalled();
    expect(userService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should set up debug interface on window', () => {
    jwtService.getToken.mockReturnValue(null);
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(window.__conduit_debug__).toBeDefined();
    expect(typeof window.__conduit_debug__!.getToken).toBe('function');
    expect(typeof window.__conduit_debug__!.getAuthState).toBe('function');
    expect(typeof window.__conduit_debug__!.getCurrentUser).toBe('function');
  });

  it('should return EMPTY when no token', () => {
    jwtService.getToken.mockReturnValue(null);
    const init = initAuth(jwtService as any, userService as any);
    const result = init();
    expect(result).toBe(EMPTY);
  });

  it('should return getCurrentUser observable when token exists', () => {
    jwtService.getToken.mockReturnValue('token');
    const mockObs = of({});
    userService.getCurrentUser.mockReturnValue(mockObs);
    const init = initAuth(jwtService as any, userService as any);
    const result = init();
    expect(result).toBe(mockObs);
  });

  it('debug interface getToken should return current token', () => {
    jwtService.getToken.mockReturnValue('my-token');
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(window.__conduit_debug__!.getToken()).toBe('my-token');
  });
});

describe('initAuth - debug interface callbacks', () => {
  let jwtService: { getToken: ReturnType<typeof vi.fn> };
  let userService: any;

  beforeEach(() => {
    jwtService = { getToken: vi.fn() };
    (window as any).__conduit_debug__ = undefined;
  });

  afterEach(() => {
    delete (window as any).__conduit_debug__;
  });

  it('debug interface getAuthState should track auth state changes', () => {
    const { BehaviorSubject } = require('rxjs');
    const authStateSubject = new BehaviorSubject('loading');
    const currentUserSubject = new BehaviorSubject(null);
    userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({})),
      purgeAuth: vi.fn(),
      authState: authStateSubject.asObservable(),
      currentUser: currentUserSubject.asObservable(),
    };
    jwtService.getToken.mockReturnValue(null);
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(window.__conduit_debug__!.getAuthState()).toBe('loading');
    authStateSubject.next('authenticated');
    expect(window.__conduit_debug__!.getAuthState()).toBe('authenticated');
  });

  it('debug interface getCurrentUser should track current user changes', () => {
    const { BehaviorSubject } = require('rxjs');
    const authStateSubject = new BehaviorSubject('loading');
    const currentUserSubject = new BehaviorSubject(null);
    userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({})),
      purgeAuth: vi.fn(),
      authState: authStateSubject.asObservable(),
      currentUser: currentUserSubject.asObservable(),
    };
    jwtService.getToken.mockReturnValue(null);
    const init = initAuth(jwtService as any, userService as any);
    init();
    expect(window.__conduit_debug__!.getCurrentUser()).toBeNull();
    const mockUser = { username: 'test', email: 'test@test.com', token: 't', bio: null, image: null };
    currentUserSubject.next(mockUser);
    expect(window.__conduit_debug__!.getCurrentUser()).toEqual(mockUser);
  });
});

describe('appConfig - provideAppInitializer integration', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should run the appInitializer callback during bootstrap', async () => {
    delete (window as any).__conduit_debug__;

    TestBed.configureTestingModule({
      providers: appConfig.providers,
    });

    const initStatus = TestBed.inject(ApplicationInitStatus);
    await initStatus.donePromise;

    // The provideAppInitializer callback (lines 74-77) should have executed,
    // calling initAuth which sets up the debug interface
    expect(window.__conduit_debug__).toBeDefined();
    expect(typeof window.__conduit_debug__!.getToken).toBe('function');
  });
});
