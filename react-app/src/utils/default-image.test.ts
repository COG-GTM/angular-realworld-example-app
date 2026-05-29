import { describe, it, expect } from 'vitest';
import { defaultImage } from './default-image';

describe('defaultImage', () => {
  it('should return image URL when provided', () => {
    expect(defaultImage('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
  });

  it('should return default avatar when null', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
  });

  it('should return default avatar when undefined', () => {
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('should return default avatar when empty string', () => {
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
  });
});
