import type { Errors } from '../types';

/**
 * Renders API validation errors. Mirrors Angular's ListErrorsComponent:
 * flattens `{ errors: { key: value } }` into "key value" list items.
 */
export function ListErrors({ errors }: { errors: Errors | null }) {
  const errorList = errors ? Object.keys(errors.errors || {}).map(key => `${key} ${errors.errors[key]}`) : [];

  if (errorList.length === 0) return null;

  return (
    <ul className="error-messages">
      {errorList.map(error => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
