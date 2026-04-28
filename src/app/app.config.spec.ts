import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject, of, EMPTY } from 'rxjs';
import { initAuth, ConduitDebug } from './app.config';
import { JwtService } from './core/auth/services/jwt.service';
import { UserService, AuthState } from './core/auth/services/user.service';
import { User } from './core/auth/user.model';

describe('app.config', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let jwtService: {
    getToken: ReturnType<typeof vi.fn>;
    saveToken: ReturnType<typeof vi.fn>;
    destroyToken: ReturnType<typeof vi.fn>;
  };
  let userService: {
    getCurrentUser: ReturnType<typeof vi.fn>;
    purgeAuth: ReturnType<typeof vi.fn>;
    authState: BehaviorSubject<AuthState>;
    currentUser: BehaviorSubject<User | null>;
  };

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-jwt-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jwtService = {
      getToken: vi.fn(),
      saveToken: vi.fn(),
      destroyToken: vi.fn(),
    };

    userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })),
      purgeAuth: vi.fn(),
      authState: new BehaviorSubject<AuthState>('loading'),
      currentUser: new BehaviorSubject<User | null>(null),
    };

    // Clean up any previous debug interface
    delete window.__conduit_debug__;
  });

  afterEach(() => {
    delete window.__conduit_debug__;
  });

  describe('initAuth', () => {
    it('should return a factory function', () => {
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      expect(typeof factory).toBe('function');
    });

    it('should call getCurrentUser when token exists', () => {
      jwtService.getToken.mockReturnValue('valid-token');
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(userService.getCurrentUser).toHaveBeenCalled();
    });

    it('should call purgeAuth and return EMPTY when no token', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      const result = factory();
      expect(userService.purgeAuth).toHaveBeenCalled();
      expect(result).toBe(EMPTY);
    });

    it('should call purgeAuth when token is empty string', () => {
      jwtService.getToken.mockReturnValue('');
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(userService.purgeAuth).toHaveBeenCalled();
    });

    it('should not call purgeAuth when token exists', () => {
      jwtService.getToken.mockReturnValue('valid-token');
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(userService.purgeAuth).not.toHaveBeenCalled();
    });

    it('should not call getCurrentUser when no token', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(userService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('setupDebugInterface (via initAuth)', () => {
    it('should set window.__conduit_debug__', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(window.__conduit_debug__).toBeDefined();
    });

    it('should expose getToken', () => {
      jwtService.getToken.mockReturnValue('my-token');
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(window.__conduit_debug__!.getToken()).toBe('my-token');
    });

    it('should expose getAuthState', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      userService.authState.next('authenticated');
      expect(window.__conduit_debug__!.getAuthState()).toBe('authenticated');
    });

    it('should expose getCurrentUser', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      userService.currentUser.next(mockUser);
      expect(window.__conduit_debug__!.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null for getCurrentUser when not authenticated', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();
      expect(window.__conduit_debug__!.getCurrentUser()).toBeNull();
    });

    it('should track auth state changes', () => {
      jwtService.getToken.mockReturnValue(undefined);
      const factory = initAuth(jwtService as unknown as JwtService, userService as unknown as UserService);
      factory();

      expect(window.__conduit_debug__!.getAuthState()).toBe('loading');
      userService.authState.next('unauthenticated');
      expect(window.__conduit_debug__!.getAuthState()).toBe('unauthenticated');
      userService.authState.next('authenticated');
      expect(window.__conduit_debug__!.getAuthState()).toBe('authenticated');
    });
  });
});
