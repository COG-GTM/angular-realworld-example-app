import { type ReactNode } from 'react';
import { useIsAuthenticated } from './user-context';

/**
 * React equivalent of the Angular `*ifAuthenticated` structural directive.
 * Renders its children only when the current auth state matches `when`.
 *
 * <IfAuthenticated when={true}>...only for logged-in users...</IfAuthenticated>
 * <IfAuthenticated when={false}>...only for logged-out users...</IfAuthenticated>
 */
export function IfAuthenticated({ when, children }: { when: boolean; children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  return isAuthenticated === when ? <>{children}</> : null;
}
