import { describe, expect, it } from 'vitest';
import { formatLongDate, formatYear } from './date';
import { defaultImage } from './defaultImage';
import { markdownToHtml } from './markdown';

describe('date utils', () => {
  it('formats a date as a long date (Angular `date: longDate` parity)', () => {
    expect(formatLongDate('2024-01-02T00:00:00.000Z')).toBe('January 2, 2024');
  });

  it('extracts the year', () => {
    expect(formatYear('2024-06-15T12:00:00.000Z')).toBe('2024');
  });
});

describe('defaultImage', () => {
  it('returns the provided image when present', () => {
    expect(defaultImage('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('falls back to the bundled default avatar when missing', () => {
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
  });
});

describe('markdownToHtml', () => {
  it('renders markdown to HTML', async () => {
    const html = await markdownToHtml('# Title\n\nHello **world**');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>world</strong>');
  });

  it('sanitizes XSS vectors', async () => {
    const html = await markdownToHtml('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('onerror');
  });
});
