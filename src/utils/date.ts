/** Equivalent to Angular's `date: 'longDate'` (e.g. "January 1, 2020"). */
export function formatLongDate(value: string | number | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
