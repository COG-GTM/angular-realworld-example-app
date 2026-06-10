import type { Errors } from '../types';

/**
 * Replaces the Angular `ListErrorsComponent`. Flattens an `Errors` object into
 * "key value" lines. Values may be a string or an array of strings depending on
 * the endpoint, so both are handled.
 */
export function ListErrors({ errors }: { errors: Errors | null }) {
  if (!errors) {
    return null;
  }

  const errorList = Object.keys(errors.errors || {}).map(key => {
    const value = errors.errors[key];
    return `${key} ${Array.isArray(value) ? value.join(', ') : value}`;
  });

  if (errorList.length === 0) {
    return null;
  }

  return (
    <ul className="error-messages">
      {errorList.map(error => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
