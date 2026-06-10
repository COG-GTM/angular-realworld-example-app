import { useRef, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Replaces the Angular `requireAuth` route guard. Redirects unauthenticated
 * users to `/login`. While the initial auth check is still running ('loading')
 * we render nothing to avoid a false redirect on hard refresh — this mirrors the
 * Angular APP_INITIALIZER which blocked bootstrap until auth resolved.
 *
 * Like Angular's `canActivate`, the decision is made once per navigation (when
 * auth first resolves) and then latched: losing auth mid-session (e.g. a global
 * 401 purge after a failed write) does NOT yank the user off the page. Angular
 * leaves protected pages only via explicit navigation (e.g. `logout()`).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();
  const grantedRef = useRef<boolean | null>(null);

  if (grantedRef.current === null) {
    if (authState === 'loading') {
      return null;
    }
    grantedRef.current = isAuthenticated;
  }

  if (!grantedRef.current) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * Replaces the login/register `canActivate` guards (`!isAuthenticated`). Sends
 * already-authenticated users back to the home page.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();

  if (authState === 'loading') {
    return null;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
