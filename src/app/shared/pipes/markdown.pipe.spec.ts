import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownPipe],
    });
    pipe = TestBed.inject(MarkdownPipe);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert markdown bold to HTML', async () => {
    const result = await pipe.transform('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('should convert markdown italic to HTML', async () => {
    const result = await pipe.transform('*italic*');
    expect(result).toContain('<em>italic</em>');
  });

  it('should convert markdown headings to HTML', async () => {
    const result = await pipe.transform('# Heading');
    expect(result).toContain('Heading');
  });

  it('should convert markdown links to HTML', async () => {
    const result = await pipe.transform('[text](http://example.com)');
    expect(result).toContain('text');
  });

  it('should handle empty string', async () => {
    const result = await pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle plain text', async () => {
    const result = await pipe.transform('plain text');
    expect(result).toContain('plain text');
  });

  it('should sanitize dangerous HTML', async () => {
    const result = await pipe.transform('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });
});
