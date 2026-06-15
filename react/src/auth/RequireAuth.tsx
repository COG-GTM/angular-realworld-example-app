import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Route guard requiring authentication. Mirrors the Angular `requireAuth` guard:
 * while auth is resolving we render nothing; once resolved, unauthenticated users
 * are redirected to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authStatus, isAuthenticated } = useAuth();

  if (authStatus === 'loading') return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Route guard for pages only available to logged-out users (login/register).
 * Authenticated users are redirected home.
 */
export function RequireAnonymous({ children }: { children: ReactNode }) {
  const { authStatus, isAuthenticated } = useAuth();

  if (authStatus === 'loading') return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
