import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders markdown to HTML', async () => {
    const html = await renderMarkdown('# Title\n\nsome **bold** text');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('sanitizes dangerous HTML', async () => {
    const html = await renderMarkdown('<img src=x onerror="alert(1)"> <script>alert(2)</script>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script>');
  });

  it('returns empty string for empty input', async () => {
    expect(await renderMarkdown('')).toBe('');
  });
});
