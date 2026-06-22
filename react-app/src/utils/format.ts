import type { Errors } from '../types';

/** Mirrors the Angular DefaultImagePipe. */
export function defaultImage(image: string | null | undefined): string {
  return image || '/assets/default-avatar.svg';
}

/** Mirrors Angular's `date: 'longDate'` (e.g. "January 1, 2024"). */
export function longDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

/** Mirrors Angular's `date: 'yyyy'`. */
export function year(value: number): string {
  return new Date(value).getFullYear().toString();
}

/**
 * Flattens an Errors object into display strings, matching the Angular
 * ListErrorsComponent: `${key} ${value}`.
 */
export function errorsToList(errors: Errors | { errors: { [key: string]: string | string[] } } | null): string[] {
  if (!errors) {
    return [];
  }
  return Object.keys(errors.errors || {}).map(key => `${key} ${errors.errors[key]}`);
}
