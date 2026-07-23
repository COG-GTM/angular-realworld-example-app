import { describe, expect, it } from 'vitest';
import { defaultImage } from './default-image';

describe('defaultImage', () => {
  it('returns the provided image when set', () => {
    expect(defaultImage('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('falls back to the default avatar for null/empty', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });
});
