/**
 * Formats a date string like Angular's DatePipe with the 'longDate' format,
 * e.g. "January 1, 2020".
 */
export function longDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns the four-digit year for a date, matching DatePipe's 'yyyy' format.
 */
export function year(date: string | number | Date): string {
  return String(new Date(date).getFullYear());
}
