import { useRef, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Requires authentication.
 *
 * Mirrors Angular's navigation-time `canActivate` semantics rather than reacting
 * to every auth-state change: once access has been granted for this mounted
 * route, we keep rendering it even if the session is later invalidated (e.g. a
 * mid-session 401 from a form submit). The user stays on the page to see the
 * error and is only gated again on the next navigation (a fresh mount).
 *
 * While the initial auth check is in flight ('loading') we render nothing — the
 * navbar still shows since it lives outside the routes.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const granted = useRef(false);

  if (authState === 'authenticated') {
    granted.current = true;
  }
  if (granted.current) {
    return <>{children}</>;
  }
  if (authState === 'loading') {
    return null;
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
