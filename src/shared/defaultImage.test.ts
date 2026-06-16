import { describe, expect, it } from 'vitest';
import { defaultImage } from './defaultImage';

describe('defaultImage', () => {
  it('returns the default avatar for null', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
  });

  it('returns the default avatar for undefined', () => {
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('returns the default avatar for an empty string', () => {
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
  });

  it('returns the provided image when present', () => {
    expect(defaultImage('https://example.com/a.png')).toBe('https://example.com/a.png');
  });
});
