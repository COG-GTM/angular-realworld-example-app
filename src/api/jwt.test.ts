import { describe, expect, it } from 'vitest';
import { destroyToken, getToken, saveToken } from './jwt';

describe('jwt token storage', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saves and retrieves a token via localStorage["jwtToken"]', () => {
    saveToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
    expect(localStorage.getItem('jwtToken')).toBe('abc.def.ghi');
  });

  it('overwrites an existing token', () => {
    saveToken('first');
    saveToken('second');
    expect(getToken()).toBe('second');
  });

  it('destroys the token', () => {
    saveToken('to-remove');
    destroyToken();
    expect(getToken()).toBeNull();
  });

  it('handles empty-string tokens', () => {
    saveToken('');
    expect(getToken()).toBe('');
  });
});
