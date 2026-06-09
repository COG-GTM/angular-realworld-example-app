import type { Errors } from '../types';

export function ListErrors({ errors }: { errors: Errors | null }) {
  if (!errors) return null;
  return (
    <ul className="error-messages">
      {Object.entries(errors).flatMap(([field, messages]) =>
        messages.map((message, i) => <li key={`${field}-${i}`}>{`${field} ${message}`}</li>),
      )}
    </ul>
  );
}
