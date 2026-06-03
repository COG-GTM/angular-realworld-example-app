import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { initTestBed } from '../../../testing/setup-test-bed';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: { sanitize: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    sanitizer = {
      sanitize: vi.fn((_ctx: number, value: string) => value),
    };

    TestBed.configureTestingModule({
      providers: [MarkdownPipe, { provide: DomSanitizer, useValue: sanitizer }],
    });

    pipe = TestBed.inject(MarkdownPipe);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should parse markdown and sanitize the result', async () => {
    const result = await pipe.transform('# Hello');
    expect(sanitizer.sanitize).toHaveBeenCalled();
    expect(result).toContain('<h1');
    expect(result).toContain('Hello');
  });

  it('should return an empty string when the sanitizer returns null', async () => {
    sanitizer.sanitize.mockReturnValue(null);
    const result = await pipe.transform('some text');
    expect(result).toBe('');
  });
});
