import type { Errors } from '../types';

interface ListErrorsProps {
  errors: Errors | null;
}

export function ListErrors({ errors }: ListErrorsProps) {
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
