import { describe, expect, it } from 'vitest';
import { currentYear, longDate } from './date';

describe('longDate', () => {
  it('formats a date as a long date', () => {
    // Use a Date object to avoid timezone-dependent parsing of ISO strings.
    expect(longDate(new Date(2024, 0, 1))).toBe('January 1, 2024');
  });

  it('returns empty string for an invalid date', () => {
    expect(longDate('not-a-date')).toBe('');
  });
});

describe('currentYear', () => {
  it('returns the current full year', () => {
    expect(currentYear()).toBe(new Date().getFullYear());
  });
});
