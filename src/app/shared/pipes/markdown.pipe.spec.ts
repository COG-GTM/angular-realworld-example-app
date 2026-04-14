import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
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

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform markdown bold to HTML', async () => {
    const result = await pipe.transform('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('should transform markdown italic to HTML', async () => {
    const result = await pipe.transform('*italic*');
    expect(result).toContain('<em>italic</em>');
  });

  it('should transform markdown heading to HTML', async () => {
    const result = await pipe.transform('# Heading');
    expect(result).toContain('Heading');
  });

  it('should handle plain text without markdown', async () => {
    const result = await pipe.transform('plain text');
    expect(result).toContain('plain text');
  });

  it('should handle empty string', async () => {
    const result = await pipe.transform('');
    expect(result).toBe('');
  });

  it('should sanitize dangerous HTML', async () => {
    const result = await pipe.transform('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  it('should handle markdown links', async () => {
    const result = await pipe.transform('[link](https://example.com)');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('link');
  });
});
