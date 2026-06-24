import { describe, it, expect } from 'vitest';
import { defaultImage, formatDate } from '../utils';

describe('defaultImage', () => {
  it('returns the image when provided', () => {
    expect(defaultImage('https://example.com/avatar.png')).toBe('https://example.com/avatar.png');
  });

  it('returns fallback for null', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
  });

  it('returns fallback for undefined', () => {
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('returns fallback for empty string', () => {
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to readable format', () => {
    const result = formatDate('2024-01-15T10:30:00.000Z');
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});
