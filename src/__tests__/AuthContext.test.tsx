import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function TestConsumer() {
  const { authState, user } = useAuth();
  return (
    <div>
      <span data-testid="auth-state">{authState}</span>
      <span data-testid="username">{user?.username ?? 'none'}</span>
    </div>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('sets unauthenticated state when no token', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
    });
  });

  it('fetches current user when token exists', async () => {
    localStorage.setItem('jwtToken', 'test-token');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          user: {
            email: 'test@test.com',
            token: 'test-token',
            username: 'testuser',
            bio: null,
            image: null,
          },
        }),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      expect(screen.getByTestId('username').textContent).toBe('testuser');
    });
  });

  it('purges auth on 401 response', async () => {
    localStorage.setItem('jwtToken', 'expired-token');
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ errors: { token: 'invalid' } }),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');
    });
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });
});
