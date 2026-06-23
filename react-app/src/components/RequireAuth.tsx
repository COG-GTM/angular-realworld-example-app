import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Route guard equivalent to Angular's requireAuth: redirect to /login when not authenticated.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();

  // Wait until the initial auth check resolves before deciding.
  if (authState === 'loading') {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Equivalent to the login/register canActivate guard: redirect away when already authenticated.
export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { authState, isAuthenticated } = useAuth();

  if (authState === 'loading') {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
