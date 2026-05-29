import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('should render nothing when errors is null', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render error list', () => {
    render(<ListErrors errors={{ errors: { email: 'is invalid' } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
  });

  it('should render multiple errors', () => {
    render(
      <ListErrors
        errors={{ errors: { email: 'is required', password: 'is too short' } }}
      />,
    );
    expect(screen.getByText('email is required')).toBeInTheDocument();
    expect(screen.getByText('password is too short')).toBeInTheDocument();
  });
});
