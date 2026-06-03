import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultImagePipe } from './default-image.pipe';

describe('DefaultImagePipe', () => {
  let pipe: DefaultImagePipe;

  beforeEach(() => {
    pipe = new DefaultImagePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the provided image when truthy', () => {
    expect(pipe.transform('https://example.com/a.png')).toBe('https://example.com/a.png');
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
});
