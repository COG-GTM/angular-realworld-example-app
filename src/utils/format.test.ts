import { describe, expect, it } from 'vitest';
import { defaultImage, formatDate, renderMarkdown } from './format';

describe('defaultImage', () => {
  it('returns the provided image when present', () => {
    expect(defaultImage('https://example.com/me.png')).toBe('https://example.com/me.png');
  });

  it('falls back to the default avatar when null/empty', () => {
    expect(defaultImage(null)).toContain('default-avatar.svg');
    expect(defaultImage('')).toContain('default-avatar.svg');
    expect(defaultImage(undefined)).toContain('default-avatar.svg');
  });
});

describe('formatDate', () => {
  it('formats a long date', () => {
    expect(formatDate('2020-01-15T00:00:00.000Z', 'longDate')).toBe('January 15, 2020');
  });

  it('formats a year', () => {
    expect(formatDate('2020-01-15T00:00:00.000Z', 'yyyy')).toBe('2020');
  });

  it('returns empty string for invalid dates', () => {
    expect(formatDate('not-a-date', 'longDate')).toBe('');
  });
});

describe('renderMarkdown', () => {
  it('renders markdown to sanitized html', async () => {
    const html = await renderMarkdown('# Hello\n\n**world**');
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
    expect(html).toContain('<strong>world</strong>');
  });

  it('strips dangerous markup', async () => {
    const html = await renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('onerror');
  });
});
