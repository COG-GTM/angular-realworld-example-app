import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ListErrors } from '../components/ListErrors';
import { Footer } from '../components/Footer';

describe('ListErrors', () => {
  it('renders nothing when errors is null', () => {
    const { container } = render(<ListErrors errors={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders error messages', () => {
    const errors = { errors: { email: 'is invalid' } };
    render(<ListErrors errors={errors} />);
    expect(screen.getByText('email is invalid')).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('renders footer with year and attribution', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
