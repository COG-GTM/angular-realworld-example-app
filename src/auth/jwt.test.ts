import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { destroyToken, getToken, saveToken } from './jwt';

describe('jwt token storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saves and retrieves a token', () => {
    saveToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
    expect(window.localStorage.getItem('jwtToken')).toBe('abc.def.ghi');
  });

  it('overwrites an existing token', () => {
    saveToken('old');
    saveToken('new');
    expect(getToken()).toBe('new');
  });

  it('destroys the token', () => {
    saveToken('to-be-removed');
    destroyToken();
    expect(getToken()).toBeNull();
  });

  it('handles destroying a non-existent token', () => {
    expect(() => destroyToken()).not.toThrow();
    expect(getToken()).toBeNull();
  });
});
