import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DefaultImagePipe } from './default-image.pipe';

describe('DefaultImagePipe', () => {
  let pipe: DefaultImagePipe;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DefaultImagePipe],
    });
    pipe = TestBed.inject(DefaultImagePipe);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return image URL when provided', () => {
    expect(pipe.transform('http://example.com/avatar.png')).toBe('http://example.com/avatar.png');
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

  it('should handle valid URLs', () => {
    const url = 'https://cdn.example.com/users/123/profile.jpg';
    expect(pipe.transform(url)).toBe(url);
  });
});
