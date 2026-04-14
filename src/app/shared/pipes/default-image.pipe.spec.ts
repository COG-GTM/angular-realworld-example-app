import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultImagePipe } from './default-image.pipe';

describe('DefaultImagePipe', () => {
  let pipe: DefaultImagePipe;

  beforeEach(() => {
    pipe = new DefaultImagePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the image URL when a valid string is provided', () => {
    expect(pipe.transform('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('should return default avatar when image is null', () => {
    expect(pipe.transform(null)).toBe('/assets/default-avatar.svg');
  });

  it('should return default avatar when image is undefined', () => {
    expect(pipe.transform(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('should return default avatar when image is empty string', () => {
    expect(pipe.transform('')).toBe('/assets/default-avatar.svg');
  });

  it('should pass through non-empty image URLs', () => {
    const url = 'https://cdn.example.com/images/user123.png';
    expect(pipe.transform(url)).toBe(url);
  });

  it('should handle relative paths', () => {
    expect(pipe.transform('/images/avatar.png')).toBe('/images/avatar.png');
  });
});
