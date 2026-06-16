import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Requires authentication. While the initial auth check is in flight ('loading')
 * we render nothing (the navbar still shows, since it lives outside the routes).
 * Anything other than 'authenticated' redirects to /login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  if (authState === 'loading') {
    return null;
  }
  if (authState === 'authenticated') {
    return <>{children}</>;
  }
  return <Navigate to="/login" replace />;
}

/**
 * Allows access only to unauthenticated users (login/register pages).
 * Authenticated users are redirected home.
 */
export function RequireAnon({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  if (authState === 'loading') {
    return null;
  }
  if (authState === 'authenticated') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
