import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultImagePipe } from './default-image.pipe';

describe('DefaultImagePipe', () => {
  let pipe: DefaultImagePipe;

  beforeEach(() => {
    pipe = new DefaultImagePipe();
  });

  it('should return the image URL when provided', () => {
    expect(pipe.transform('https://example.com/avatar.jpg')).toBe('https://example.com/avatar.jpg');
  });

  it('should return the default avatar for null', () => {
    expect(pipe.transform(null)).toBe('/assets/default-avatar.svg');
  });

  it('should return the default avatar for undefined', () => {
    expect(pipe.transform(undefined)).toBe('/assets/default-avatar.svg');
  });

  it('should return the default avatar for an empty string', () => {
    expect(pipe.transform('')).toBe('/assets/default-avatar.svg');
  });

  it('should return relative image paths unchanged', () => {
    expect(pipe.transform('/images/user.png')).toBe('/images/user.png');
  });
});
