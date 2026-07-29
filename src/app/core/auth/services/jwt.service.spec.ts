import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { JwtService } from './jwt.service';

describe('JwtService', () => {
  let service: JwtService;
  let store: Record<string, string | null>;
  let localStorageSpy: any;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    // Create spy for localStorage backed by an in-memory store
    store = {};
    localStorageSpy = {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    // Replace window.localStorage with spy
    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [JwtService],
    });

    service = TestBed.inject(JwtService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getToken', () => {
    it('should retrieve token from localStorage', () => {
      const mockToken = 'test-jwt-token-123';
      store['jwtToken'] = mockToken;
      const token = service.getToken();
      expect(token).toBe(mockToken);
    });

    it('should return null when no token exists', () => {
      const token = service.getToken();
      expect(token).toBeNull();
    });

    it('should handle empty string token', () => {
      store['jwtToken'] = '';
      const token = service.getToken();
      expect(token).toBe('');
    });

    it('should handle null token', () => {
      store['jwtToken'] = null;
      const token = service.getToken();
      expect(token).toBeNull();
    });

    it('should retrieve token multiple times consistently', () => {
      const mockToken = 'consistent-token';
      store['jwtToken'] = mockToken;
      const token1 = service.getToken();
      const token2 = service.getToken();
      const token3 = service.getToken();
      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
    });

    it('should handle long JWT token', () => {
      const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(500);
      store['jwtToken'] = longToken;
      const token = service.getToken();
      expect(token).toBe(longToken);
    });

    it('should handle token with special characters', () => {
      const specialToken = 'token.with-special_chars!@#$%^&*()';
      store['jwtToken'] = specialToken;
      const token = service.getToken();
      expect(token).toBe(specialToken);
    });
  });

  describe('saveToken', () => {
    it('should save token to localStorage', () => {
      const mockToken = 'new-jwt-token-456';
      service.saveToken(mockToken);
      expect(store['jwtToken']).toBe(mockToken);
    });

    it('should overwrite existing token', () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      store['jwtToken'] = oldToken;
      service.saveToken(newToken);
      expect(store['jwtToken']).toBe(newToken);
    });

    it('should handle empty string token', () => {
      service.saveToken('');
      expect(store['jwtToken']).toBe('');
    });

    it('should handle very long token', () => {
      const longToken = 'a'.repeat(1000);
      service.saveToken(longToken);
      expect(store['jwtToken']).toBe(longToken);
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token.with-special_chars!@#$%';
      service.saveToken(specialToken);
      expect(store['jwtToken']).toBe(specialToken);
    });

    it('should handle JWT format tokens', () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      service.saveToken(jwtToken);
      expect(store['jwtToken']).toBe(jwtToken);
    });

    it('should persist token after save', () => {
      const token = 'persist-test-token';
      service.saveToken(token);
      const retrievedToken = service.getToken();
      expect(retrievedToken).toBe(token);
    });

    it('should handle rapid successive saves', () => {
      const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];
      tokens.forEach(token => {
        service.saveToken(token);
      });
      expect(store['jwtToken']).toBe(tokens[tokens.length - 1]);
    });
  });

  describe('destroyToken', () => {
    it('should remove token from localStorage', () => {
      store['jwtToken'] = 'test-token';
      service.destroyToken();
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle destroying non-existent token', () => {
      service.destroyToken();
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should completely remove token', () => {
      store['jwtToken'] = 'test-token';
      service.destroyToken();
      const token = service.getToken();
      expect(token).toBeNull();
    });

    it('should be idempotent', () => {
      store['jwtToken'] = 'test-token';
      service.destroyToken();
      service.destroyToken();
      service.destroyToken();
      expect(localStorageSpy.removeItem).toHaveBeenCalledTimes(3);
    });

    it('should allow saving new token after destroy', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      service.saveToken(firstToken);
      service.destroyToken();
      service.saveToken(secondToken);
      expect(store['jwtToken']).toBe(secondToken);
    });
  });

  describe('Token lifecycle', () => {
    it('should handle complete token lifecycle', () => {
      const token = 'lifecycle-test-token';
      // Save token
      service.saveToken(token);
      expect(store['jwtToken']).toBe(token);
      // Retrieve token
      const retrievedToken = service.getToken();
      expect(retrievedToken).toBe(token);
      // Destroy token
      service.destroyToken();
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle multiple save operations', () => {
      const tokens = ['token1', 'token2', 'token3'];
      tokens.forEach(token => {
        service.saveToken(token);
        expect(store['jwtToken']).toBe(token);
      });
      // Last token should be saved
      expect(store['jwtToken']).toBe(tokens[tokens.length - 1]);
    });

    it('should handle save after destroy', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      service.saveToken(firstToken);
      service.destroyToken();
      service.saveToken(secondToken);
      expect(store['jwtToken']).toBe(secondToken);
    });

    it('should handle alternating save and destroy', () => {
      service.saveToken('token1');
      service.destroyToken();
      service.saveToken('token2');
      service.destroyToken();
      service.saveToken('token3');
      expect(store['jwtToken']).toBe('token3');
    });
  });

  describe('Edge cases', () => {
    it('should handle token with whitespace', () => {
      const tokenWithSpaces = '  token-with-spaces  ';
      service.saveToken(tokenWithSpaces);
      expect(store['jwtToken']).toBe(tokenWithSpaces);
    });

    it('should handle token with newlines', () => {
      const tokenWithNewlines = 'token\nwith\nnewlines';
      service.saveToken(tokenWithNewlines);
      expect(store['jwtToken']).toBe(tokenWithNewlines);
    });

    it('should handle unicode characters in token', () => {
      const unicodeToken = 'token-with-émojis-🚀-and-中文';
      service.saveToken(unicodeToken);
      expect(store['jwtToken']).toBe(unicodeToken);
    });

    it('should handle numeric token', () => {
      const numericToken = '123456789';
      service.saveToken(numericToken);
      expect(store['jwtToken']).toBe(numericToken);
    });

    it('should handle boolean-like token', () => {
      const booleanToken = 'true';
      service.saveToken(booleanToken);
      expect(store['jwtToken']).toBe(booleanToken);
    });
  });

  describe('Security considerations', () => {
    it('should not expose token in service properties', () => {
      const token = 'secret-token';
      service.saveToken(token);
      // Service should not have a public token property
      expect((service as any).token).toBeUndefined();
    });

    it('should store token only in localStorage', () => {
      const token = 'secure-token';
      service.saveToken(token);
      // Token should only be in localStorage, not in service instance
      const serviceKeys = Object.keys(service);
      expect(serviceKeys).not.toContain('token');
      expect(serviceKeys).not.toContain('jwtToken');
    });

    it('should handle XSS-like token strings safely', () => {
      const xssToken = '<script>alert("xss")</script>';
      service.saveToken(xssToken);
      expect(store['jwtToken']).toBe(xssToken);
    });
  });

  describe('Integration scenarios', () => {
    it('should support authentication flow', () => {
      // User logs in
      const loginToken = 'login-jwt-token';
      service.saveToken(loginToken);
      expect(service.getToken()).toBe(loginToken);
      // User refreshes token
      const refreshedToken = 'refreshed-jwt-token';
      service.saveToken(refreshedToken);
      expect(service.getToken()).toBe(refreshedToken);
      // User logs out
      service.destroyToken();
      expect(service.getToken()).toBeNull();
    });

    it('should support session management', () => {
      // Start session
      service.saveToken('session-token-1');
      // Verify session
      expect(service.getToken()).toBe('session-token-1');
      // Update session
      service.saveToken('session-token-2');
      expect(service.getToken()).toBe('session-token-2');
      // End session
      service.destroyToken();
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle concurrent tab scenario', () => {
      // Simulate token being set in another tab
      store['jwtToken'] = 'external-token';
      // Current tab should be able to read it
      expect(service.getToken()).toBe('external-token');
      // Current tab updates token
      service.saveToken('updated-token');
      expect(store['jwtToken']).toBe('updated-token');
    });
  });
});
