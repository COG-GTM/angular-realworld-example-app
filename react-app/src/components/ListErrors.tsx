import type { Errors } from '../types';
import { errorsToList } from '../utils/format';
import type { ApiError } from '../api/client';

interface ListErrorsProps {
  errors: Errors | ApiError | null;
}

export function ListErrors({ errors }: ListErrorsProps) {
  const errorList = errorsToList(errors);
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
