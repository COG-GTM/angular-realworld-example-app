import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import * as authApi from '../api/auth';
import { saveToken } from '../api/jwt';
import type { User } from '../types/user';

const mockUser: User = { email: 'a@b.com', token: 'valid-token', username: 'u', bio: null, image: null };

function Probe() {
  const { authState, currentUser } = useAuth();
  return (
    <div>
      <span data-testid="state">{authState}</span>
      <span data-testid="user">{currentUser?.username ?? 'none'}</span>
    </div>
  );
}

function renderApp() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider initialization', () => {
  it('settles as unauthenticated when there is no token', async () => {
    renderApp();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('unauthenticated'));
  });

  it('authenticates when a stored token validates', async () => {
    saveToken('valid-token');
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockUser);
    renderApp();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('u');
  });

  it('clears the token and becomes unauthenticated on a 4XX', async () => {
    saveToken('bad-token');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue({ errors: {}, status: 401 });
    renderApp();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('unauthenticated'));
    expect(localStorage.getItem('jwtToken')).toBeNull();
  });

  it('enters unavailable and keeps the token on a 5XX', async () => {
    saveToken('keep-me');
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue({ errors: {}, status: 500 });
    renderApp();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('unavailable'));
    expect(localStorage.getItem('jwtToken')).toBe('keep-me');
  });

  it('exposes the debug interface on window', async () => {
    renderApp();
    await waitFor(() => expect(window.__conduit_debug__).toBeDefined());
    expect(typeof window.__conduit_debug__?.getAuthState).toBe('function');
    expect(typeof window.__conduit_debug__?.getToken).toBe('function');
    expect(typeof window.__conduit_debug__?.getCurrentUser).toBe('function');
  });
});
