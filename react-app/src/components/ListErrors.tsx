interface Props {
  errors: Record<string, string[]> | null;
}

function ListErrors({ errors }: Props) {
  if (!errors) return null;

  return (
    <ul className="error-messages">
      {Object.entries(errors).map(([field, messages]) =>
        messages.map((message, i) => (
          <li key={`${field}-${i}`}>
            {field} {message}
          </li>
        ))
      )}
    </ul>
  );
}

export default ListErrors;
