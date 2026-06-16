const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Formats an ISO date string as a long date, e.g. "January 1, 2024".
 * Mirrors Angular's `DatePipe` with the `'longDate'` format.
 */
export function longDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return longDateFormatter.format(date);
}

/** Current full year (used by the footer). */
export function currentYear(): number {
  return new Date().getFullYear();
}
