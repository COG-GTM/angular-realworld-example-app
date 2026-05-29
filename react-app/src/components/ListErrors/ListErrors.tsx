import type { Errors } from '../../types';
import { formatErrors } from '../../utils/errors';

export function ListErrors({ errors }: { errors: Errors | null }) {
  const errorList = formatErrors(errors);
  if (errorList.length === 0) return null;

  return (
    <ul className="error-messages">
      {errorList.map(err => (
        <li key={err}>{err}</li>
      ))}
    </ul>
  );
}
