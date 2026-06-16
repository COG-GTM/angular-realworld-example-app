import type { User } from '../types/user';
import type { AuthState } from './AuthContext';
import { getToken } from './jwt';

/**
 * Framework-agnostic debug interface consumed by the RealWorld e2e suite via
 * `window.__conduit_debug__`. Getters must return live values.
 */
export interface ConduitDebug {
  getToken: () => string | null;
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}

declare global {
  interface Window {
    __conduit_debug__?: ConduitDebug;
  }
}

export function installDebugInterface(getters: {
  getAuthState: () => AuthState;
  getCurrentUser: () => User | null;
}): void {
  window.__conduit_debug__ = {
    getToken: () => getToken(),
    getAuthState: getters.getAuthState,
    getCurrentUser: getters.getCurrentUser,
  };
}
