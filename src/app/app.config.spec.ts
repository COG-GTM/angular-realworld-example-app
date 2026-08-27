import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { initAuth, appConfig } from './app.config';
import { JwtService } from './core/auth/services/jwt.service';
import { UserService, AuthState } from './core/auth/services/user.service';
import { User } from './core/auth/user.model';

describe('app.config', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete window.__conduit_debug__;
  });

  const mockUser: User = { email: 'a@b.c', token: 't', username: 'u', bio: null, image: null };

  function makeUserService(user: User | null, state: AuthState) {
    return {
      authState: new BehaviorSubject<AuthState>(state),
      currentUser: new BehaviorSubject<User | null>(user),
      getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })),
      purgeAuth: vi.fn(),
    };
  }

  it('should export appConfig with providers', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('should validate token via getCurrentUser when a token exists', () => {
    const jwtService = { getToken: vi.fn().mockReturnValue('token') } as unknown as JwtService;
    const userService = makeUserService(mockUser, 'authenticated');

    const result = initAuth(jwtService, userService as unknown as UserService)();

    expect(userService.getCurrentUser).toHaveBeenCalled();
    expect(userService.purgeAuth).not.toHaveBeenCalled();
    expect(result).not.toBe(EMPTY);
  });

  it('should purge auth when no token exists', () => {
    const jwtService = { getToken: vi.fn().mockReturnValue(null) } as unknown as JwtService;
    const userService = makeUserService(null, 'unauthenticated');

    const result = initAuth(jwtService, userService as unknown as UserService)();

    expect(userService.purgeAuth).toHaveBeenCalled();
    expect(result).toBe(EMPTY);
  });

  it('should expose the debug interface on window', () => {
    const jwtService = { getToken: vi.fn().mockReturnValue('token') } as unknown as JwtService;
    const userService = makeUserService(mockUser, 'authenticated');

    initAuth(jwtService, userService as unknown as UserService)();

    expect(window.__conduit_debug__).toBeDefined();
    expect(window.__conduit_debug__!.getToken()).toBe('token');
    expect(window.__conduit_debug__!.getAuthState()).toBe('authenticated');
    expect(window.__conduit_debug__!.getCurrentUser()).toEqual(mockUser);
  });
});
