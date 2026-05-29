import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render the footer with current year', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('should render the RealWorld link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText('RealWorld OSS Project')).toBeInTheDocument();
  });
});
