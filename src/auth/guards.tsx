import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Protects a route that requires authentication. While auth is still resolving we
 * render nothing (the persistent header/footer stay visible); once resolved an
 * unauthenticated visitor is redirected to /login.
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
