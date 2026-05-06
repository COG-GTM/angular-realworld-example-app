import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './services/user.service';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authState } = useUser();

  if (authState === 'loading') return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
