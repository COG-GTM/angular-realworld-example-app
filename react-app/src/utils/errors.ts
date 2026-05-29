import type { Errors } from '../types';

export function formatErrors(errors: Errors | null): string[] {
  if (!errors?.errors) return [];
  return Object.entries(errors.errors).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).map(msg => `${key} ${msg}`),
  );
}
