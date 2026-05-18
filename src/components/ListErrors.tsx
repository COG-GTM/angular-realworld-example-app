import type { Errors } from '../models/errors.model';

export function ListErrors({ errors }: { errors: Errors | null }) {
  if (!errors || !errors.errors) return null;

  const errorList = Object.keys(errors.errors).map(key => `${key} ${errors.errors[key]}`);

  if (errorList.length === 0) return null;

  return (
    <ul className="error-messages">
      {errorList.map(error => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
