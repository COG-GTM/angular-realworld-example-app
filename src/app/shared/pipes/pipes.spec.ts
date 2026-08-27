import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DefaultImagePipe } from './default-image.pipe';
import { MarkdownPipe } from './markdown.pipe';

describe('pipes', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('DefaultImagePipe', () => {
    const pipe = new DefaultImagePipe();

    it('should return the image when provided', () => {
      expect(pipe.transform('https://example.com/avatar.png')).toBe('https://example.com/avatar.png');
    });

    it('should return the default avatar for null', () => {
      expect(pipe.transform(null)).toBe('/assets/default-avatar.svg');
    });

    it('should return the default avatar for undefined', () => {
      expect(pipe.transform(undefined)).toBe('/assets/default-avatar.svg');
    });

    it('should return the default avatar for empty string', () => {
      expect(pipe.transform('')).toBe('/assets/default-avatar.svg');
    });
  });

  describe('MarkdownPipe', () => {
    it('should convert markdown to sanitized html', async () => {
      TestBed.configureTestingModule({});
      const pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());

      const html = await pipe.transform('# Hello **world**');

      expect(html).toContain('<h1>Hello <strong>world</strong></h1>');
    });

    it('should strip dangerous html', async () => {
      TestBed.configureTestingModule({});
      const pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());

      const html = await pipe.transform('<script>alert(1)</script>plain');

      expect(html).not.toContain('<script>');
      expect(html).toContain('plain');
    });
  });
});
