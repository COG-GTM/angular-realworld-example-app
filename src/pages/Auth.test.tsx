import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth';
import { AuthProvider } from '../context/AuthContext';

function renderAuth() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<h1>Home Feed</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Auth page (login)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the sign in form', () => {
    renderAuth();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('logs in and stores the token, then navigates home', async () => {
    const user = {
      email: 'jake@jake.jake',
      token: 'jwt.token.here',
      username: 'jake',
      bio: null,
      image: null,
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ user }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    renderAuth();

    await userEvent.type(screen.getByPlaceholderText('Email'), 'jake@jake.jake');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Home Feed' })).toBeInTheDocument();
    });
    expect(localStorage.getItem('jwtToken')).toBe('jwt.token.here');

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.realworld.show/api/users/login');
    expect(options.method).toBe('POST');
  });
});
