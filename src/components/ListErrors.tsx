import type { Errors } from '../types/errors';

/**
 * Renders a list of API/validation errors as `<ul class="error-messages">`.
 * Each entry is formatted as "<key> <message>" (matching the Angular component).
 */
export function ListErrors({ errors }: { errors?: Errors | null }) {
  const errorList: string[] = [];
  if (errors && errors.errors) {
    for (const key of Object.keys(errors.errors)) {
      const value = errors.errors[key];
      const messages = Array.isArray(value) ? value : [value];
      for (const message of messages) {
        errorList.push(`${key} ${message}`);
      }
    }
  }

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
