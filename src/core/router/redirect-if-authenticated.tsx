import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '../auth/user-context';

/**
 * Guard wrapper for /login and /register: redirects authenticated users to the
 * home page, otherwise renders the wrapped page.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
