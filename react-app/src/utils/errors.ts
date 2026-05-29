import type { Errors } from '../types';

export function formatErrors(errors: Errors | null): string[] {
  if (!errors?.errors) return [];
  return Object.keys(errors.errors).map(key => `${key} ${errors.errors[key]}`);
}
