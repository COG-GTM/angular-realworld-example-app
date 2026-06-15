/**
 * Formats an ISO date the same way Angular's DatePipe 'longDate' format does,
 * e.g. "January 1, 2024".
 */
export function longDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
