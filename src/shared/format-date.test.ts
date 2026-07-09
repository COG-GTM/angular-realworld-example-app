import { describe, expect, it } from 'vitest';
import { longDate, year } from './format-date';

describe('format-date', () => {
  it('formats a date as a long date', () => {
    expect(longDate('2020-01-15T12:00:00.000Z')).toBe('January 15, 2020');
  });

  it('extracts the four-digit year', () => {
    expect(year('2020-01-15T12:00:00.000Z')).toBe('2020');
  });
});
