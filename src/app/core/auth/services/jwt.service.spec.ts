import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { JwtService } from './jwt.service';
import { LOCAL_STORAGE } from './storage.token';

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  } as Storage;
}

describe('JwtService', () => {
  let service: JwtService;
  let mockStorage: Storage;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockStorage = createMockStorage();

    TestBed.configureTestingModule({
      providers: [JwtService, { provide: LOCAL_STORAGE, useValue: mockStorage }],
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
    it('should retrieve token from storage', () => {
      const mockToken = 'test-jwt-token-123';
      mockStorage.setItem('jwtToken', mockToken);
      const token = service.getToken();
      expect(token).toBe(mockToken);
    });

    it('should return empty string when no token exists', () => {
      const token = service.getToken();
      expect(token).toBe('');
    });

    it('should handle empty string token', () => {
      mockStorage.setItem('jwtToken', '');
      const token = service.getToken();
      expect(token).toBe('');
    });

    it('should retrieve token multiple times consistently', () => {
      const mockToken = 'consistent-token';
      mockStorage.setItem('jwtToken', mockToken);
      const token1 = service.getToken();
      const token2 = service.getToken();
      const token3 = service.getToken();
      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
    });

    it('should handle long JWT token', () => {
      const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'a'.repeat(500);
      mockStorage.setItem('jwtToken', longToken);
      const token = service.getToken();
      expect(token).toBe(longToken);
    });

    it('should handle token with special characters', () => {
      const specialToken = 'token.with-special_chars!@#$%^&*()';
      mockStorage.setItem('jwtToken', specialToken);
      const token = service.getToken();
      expect(token).toBe(specialToken);
    });
  });

  describe('saveToken', () => {
    it('should save token to storage', () => {
      const mockToken = 'new-jwt-token-456';
      service.saveToken(mockToken);
      expect(mockStorage.getItem('jwtToken')).toBe(mockToken);
    });

    it('should overwrite existing token', () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      mockStorage.setItem('jwtToken', oldToken);
      service.saveToken(newToken);
      expect(mockStorage.getItem('jwtToken')).toBe(newToken);
    });

    it('should handle empty string token', () => {
      service.saveToken('');
      expect(mockStorage.getItem('jwtToken')).toBe('');
    });

    it('should handle very long token', () => {
      const longToken = 'a'.repeat(1000);
      service.saveToken(longToken);
      expect(mockStorage.getItem('jwtToken')).toBe(longToken);
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token.with-special_chars!@#$%';
      service.saveToken(specialToken);
      expect(mockStorage.getItem('jwtToken')).toBe(specialToken);
    });

    it('should handle JWT format tokens', () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      service.saveToken(jwtToken);
      expect(mockStorage.getItem('jwtToken')).toBe(jwtToken);
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
      expect(mockStorage.getItem('jwtToken')).toBe(tokens[tokens.length - 1]);
    });
  });

  describe('destroyToken', () => {
    it('should remove token from storage', () => {
      mockStorage.setItem('jwtToken', 'test-token');
      service.destroyToken();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle destroying non-existent token', () => {
      service.destroyToken();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should completely remove token', () => {
      mockStorage.setItem('jwtToken', 'test-token');
      service.destroyToken();
      const token = service.getToken();
      expect(token).toBe('');
    });

    it('should be idempotent', () => {
      mockStorage.setItem('jwtToken', 'test-token');
      service.destroyToken();
      service.destroyToken();
      service.destroyToken();
      expect(mockStorage.removeItem).toHaveBeenCalledTimes(3);
    });

    it('should allow saving new token after destroy', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      service.saveToken(firstToken);
      service.destroyToken();
      service.saveToken(secondToken);
      expect(mockStorage.getItem('jwtToken')).toBe(secondToken);
    });
  });

  describe('Token lifecycle', () => {
    it('should handle complete token lifecycle', () => {
      const token = 'lifecycle-test-token';
      service.saveToken(token);
      expect(mockStorage.getItem('jwtToken')).toBe(token);
      const retrievedToken = service.getToken();
      expect(retrievedToken).toBe(token);
      service.destroyToken();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle multiple save operations', () => {
      const tokens = ['token1', 'token2', 'token3'];
      tokens.forEach(token => {
        service.saveToken(token);
        expect(mockStorage.getItem('jwtToken')).toBe(token);
      });
      expect(mockStorage.getItem('jwtToken')).toBe(tokens[tokens.length - 1]);
    });

    it('should handle save after destroy', () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';
      service.saveToken(firstToken);
      service.destroyToken();
      service.saveToken(secondToken);
      expect(mockStorage.getItem('jwtToken')).toBe(secondToken);
    });

    it('should handle alternating save and destroy', () => {
      service.saveToken('token1');
      service.destroyToken();
      service.saveToken('token2');
      service.destroyToken();
      service.saveToken('token3');
      expect(mockStorage.getItem('jwtToken')).toBe('token3');
    });
  });

  describe('Edge cases', () => {
    it('should handle token with whitespace', () => {
      const tokenWithSpaces = '  token-with-spaces  ';
      service.saveToken(tokenWithSpaces);
      expect(mockStorage.getItem('jwtToken')).toBe(tokenWithSpaces);
    });

    it('should handle token with newlines', () => {
      const tokenWithNewlines = 'token\nwith\nnewlines';
      service.saveToken(tokenWithNewlines);
      expect(mockStorage.getItem('jwtToken')).toBe(tokenWithNewlines);
    });

    it('should handle unicode characters in token', () => {
      const unicodeToken = 'token-with-émojis-🚀-and-中文';
      service.saveToken(unicodeToken);
      expect(mockStorage.getItem('jwtToken')).toBe(unicodeToken);
    });

    it('should handle numeric token', () => {
      const numericToken = '123456789';
      service.saveToken(numericToken);
      expect(mockStorage.getItem('jwtToken')).toBe(numericToken);
    });

    it('should handle boolean-like token', () => {
      const booleanToken = 'true';
      service.saveToken(booleanToken);
      expect(mockStorage.getItem('jwtToken')).toBe(booleanToken);
    });
  });

  describe('Security considerations', () => {
    it('should not expose token in service properties', () => {
      const token = 'secret-token';
      service.saveToken(token);
      expect((service as any).token).toBeUndefined();
    });

    it('should delegate storage entirely to the injected Storage', () => {
      const token = 'secure-token';
      service.saveToken(token);
      expect(mockStorage.setItem).toHaveBeenCalledWith('jwtToken', token);
      const serviceKeys = Object.keys(service);
      expect(serviceKeys).not.toContain('token');
      expect(serviceKeys).not.toContain('jwtToken');
    });

    it('should handle XSS-like token strings safely', () => {
      const xssToken = '<script>alert("xss")</script>';
      service.saveToken(xssToken);
      expect(mockStorage.getItem('jwtToken')).toBe(xssToken);
    });
  });

  describe('Integration scenarios', () => {
    it('should support authentication flow', () => {
      const loginToken = 'login-jwt-token';
      service.saveToken(loginToken);
      expect(service.getToken()).toBe(loginToken);
      const refreshedToken = 'refreshed-jwt-token';
      service.saveToken(refreshedToken);
      expect(service.getToken()).toBe(refreshedToken);
      service.destroyToken();
      expect(service.getToken()).toBe('');
    });

    it('should support session management', () => {
      service.saveToken('session-token-1');
      expect(service.getToken()).toBe('session-token-1');
      service.saveToken('session-token-2');
      expect(service.getToken()).toBe('session-token-2');
      service.destroyToken();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('jwtToken');
    });

    it('should handle concurrent tab scenario', () => {
      mockStorage.setItem('jwtToken', 'external-token');
      expect(service.getToken()).toBe('external-token');
      service.saveToken('updated-token');
      expect(mockStorage.getItem('jwtToken')).toBe('updated-token');
    });
  });
});
