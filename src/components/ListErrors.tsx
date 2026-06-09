import type { Errors } from '../types';

/**
 * Renders API/validation errors as a list. Port of Angular ListErrorsComponent.
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
