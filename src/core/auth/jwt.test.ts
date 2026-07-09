import { describe, expect, it } from 'vitest';
import { destroyToken, getToken, saveToken } from './jwt';

describe('jwt', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('saves and reads the token from localStorage under jwtToken', () => {
    saveToken('abc.def.ghi');
    expect(getToken()).toBe('abc.def.ghi');
    expect(window.localStorage.getItem('jwtToken')).toBe('abc.def.ghi');
  });

  it('destroys the stored token', () => {
    saveToken('abc.def.ghi');
    destroyToken();
    expect(getToken()).toBeNull();
  });
});
