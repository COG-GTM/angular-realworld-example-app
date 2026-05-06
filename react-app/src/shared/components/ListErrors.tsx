import type { Errors } from '../../core/models/errors.model';

interface ListErrorsProps {
  errors: Errors | null;
}

export function ListErrors({ errors }: ListErrorsProps) {
  if (!errors || !errors.errors) return null;

  const errorList = Object.entries(errors.errors).flatMap(([key, messages]) =>
    messages.map((msg) => `${key} ${msg}`),
  );

  if (errorList.length === 0) return null;

  return (
    <ul className="error-messages">
      {errorList.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
