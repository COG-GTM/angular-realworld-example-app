import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let pipe: MarkdownPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownPipe],
    });
    pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render markdown headings to HTML', async () => {
    const html = await pipe.transform('# Hello');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
  });

  it('should render bold text', async () => {
    const html = await pipe.transform('**bold**');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('should render links', async () => {
    const html = await pipe.transform('[link](https://example.com)');
    expect(html).toContain('href="https://example.com"');
  });

  it('should sanitize script tags', async () => {
    const html = await pipe.transform('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });

  it('should return empty string for empty content', async () => {
    const html = await pipe.transform('');
    expect(html).toBe('');
  });

  it('should render plain text wrapped in a paragraph', async () => {
    const html = await pipe.transform('just text');
    expect(html).toContain('<p>just text</p>');
  });
});
