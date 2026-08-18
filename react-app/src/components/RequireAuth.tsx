import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: ReactElement }) {
  const { authState, isAuthenticated } = useAuth();

  if (authState === 'loading') {
    return null;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
