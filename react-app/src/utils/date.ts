/**
 * Replaces Angular's `DatePipe` usages. `longDate` matches Angular's
 * `date: 'longDate'` format (e.g. "January 1, 2024").
 */
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatLongDate(value: string | number | Date): string {
  return longDateFormatter.format(new Date(value));
}

export function formatYear(value: string | number | Date): string {
  return new Date(value).getFullYear().toString();
}
