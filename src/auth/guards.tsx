import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Protects a route that requires authentication. While auth is still resolving we
 * render nothing (the persistent header/footer stay visible); once resolved an
 * unauthenticated visitor is redirected to /login.
 *
 * Like Angular's `canActivate`, the check is point-in-time: once access has been
 * granted for this mount we keep rendering the page even if auth later drops (e.g.
 * a mid-session 401 from a form submission). Navigating away and back re-checks.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();
  const grantedRef = useRef(false);

  if (isAuthenticated) {
    grantedRef.current = true;
  }
  if (grantedRef.current) {
    return <>{children}</>;
  }
  if (authState === 'loading') {
    return null;
  }
  return <Navigate to="/login" replace />;
}

/** For /login and /register: send already-authenticated users back home. */
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
