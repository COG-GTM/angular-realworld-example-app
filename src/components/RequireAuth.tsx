import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authState, isLoggingOut } = useAuth();

  if (authState === 'loading') return null;
  if (!isAuthenticated && !isLoggingOut) return <Navigate to="/login" replace />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export function RequireUnauth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authState } = useAuth();

  if (authState === 'loading') return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}
