import { describe, expect, it } from 'vitest';
import { DEFAULT_AVATAR, defaultImage } from './image';

describe('defaultImage', () => {
  it('returns the image when present', () => {
    expect(defaultImage('https://x/y.png')).toBe('https://x/y.png');
  });

  it('returns the default avatar for null/empty', () => {
    expect(defaultImage(null)).toBe(DEFAULT_AVATAR);
    expect(defaultImage(undefined)).toBe(DEFAULT_AVATAR);
    expect(defaultImage('')).toBe(DEFAULT_AVATAR);
  });

  it('uses a path containing default-avatar.svg', () => {
    expect(DEFAULT_AVATAR).toContain('default-avatar.svg');
  });
});
