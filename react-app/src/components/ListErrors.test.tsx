import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('flattens an Errors object into "key value" lines', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid'], password: ['is too short'] } }} />);
    const list = screen.getByRole('list');
    expect(list).toHaveClass('error-messages');
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getByText('password is too short')).toBeInTheDocument();
  });
});
