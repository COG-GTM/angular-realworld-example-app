/** Formats an ISO date string like Angular's `date: 'longDate'` (e.g. "January 1, 2024"). */
export function longDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
