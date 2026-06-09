import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes that require authentication (settings, editor). Waits while
 * auth is still resolving, then redirects unauthenticated users to /login.
 * Replaces the Angular `requireAuth` route guard.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();

  if (authState === 'loading') {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Guest-only routes (login, register). Redirects authenticated users home,
 * replacing the Angular `!isAuthenticated` canActivate guard.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();

  if (authState === 'loading') {
    return null;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
