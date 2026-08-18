const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Equivalent of Angular's `date: 'longDate'` pipe (e.g. "January 5, 2024"). */
export function longDate(value: string): string {
  return longDateFormatter.format(new Date(value));
}

/** Equivalent of the Angular `defaultImage` pipe. */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}
