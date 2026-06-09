import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each error with its field key', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid', 'is required'] } }} />);
    expect(screen.getByText('email is invalid, is required')).toBeInTheDocument();
  });

  it('handles string error values', () => {
    render(<ListErrors errors={{ errors: { body: 'cannot be blank' } }} />);
    expect(screen.getByText('body cannot be blank')).toBeInTheDocument();
  });
});
