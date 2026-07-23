import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './list-errors';

describe('ListErrors', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container.querySelector('.error-messages')).toBeNull();
  });

  it('renders a message per field combining key and value', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid'], password: ['is too short'] } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getByText('password is too short')).toBeInTheDocument();
  });
});
