import { Errors } from '../../core/models/errors';

/**
 * Renders validation / API errors from the normalized error shape.
 * Replaces the Angular `app-list-errors` component.
 */
export function ListErrors({ errors }: { errors: Errors | null | undefined }) {
  const errorList = errors ? Object.keys(errors.errors || {}).map(key => `${key} ${errors.errors[key]}`) : [];

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
