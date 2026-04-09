import { Errors } from "../../models/errors.model";

interface ListErrorsProps {
  errors: Errors | null;
}

export function ListErrors({ errors }: ListErrorsProps) {
  if (!errors) return null;

  const errorList = Object.keys(errors.errors || {}).map(
    (key) => `${key} ${errors.errors[key]}`,
  );

  if (errorList.length === 0) return null;

  return (
    <ul className="error-messages">
      {errorList.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  );
}
