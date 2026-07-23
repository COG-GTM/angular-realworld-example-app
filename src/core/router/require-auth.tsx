import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../auth/user-context';

/**
 * Guard wrapper that requires authentication. Redirects to /login when the
 * user is not authenticated. While the initial auth check (or a retry) is in
 * progress we render nothing rather than redirecting, so a valid token is not
 * prematurely rejected on a hard reload.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated, initialized } = useUser();

  if (!initialized || authState === 'loading') {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <Navigate to="/login" replace />;
}
