import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListErrors } from './ListErrors';

describe('ListErrors', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each error as "<key> <value>"', () => {
    render(<ListErrors errors={{ errors: { email: ['is invalid'], password: ['is too short'] } }} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
    expect(screen.getByText('password is too short')).toBeInTheDocument();
    expect(document.querySelector('ul.error-messages')).not.toBeNull();
  });

  it('renders the network fallback message', () => {
    render(
      <ListErrors errors={{ errors: { network: ['Unable to connect. Please check your internet connection.'] } }} />,
    );
    expect(screen.getByText(/Unable to connect/)).toBeInTheDocument();
  });
});
