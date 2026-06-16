import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders basic markdown to HTML', () => {
    const html = renderMarkdown('# Hello\n\nworld');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('world');
  });

  it('strips <script> tags', () => {
    const html = renderMarkdown('text <script>alert(1)</script> more');
    expect(html).not.toContain('<script');
  });

  it('strips event-handler attributes', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html.toLowerCase()).not.toContain('onerror');
  });

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });
});
