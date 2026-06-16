/// <reference types="vite/client" />

import type { AuthState } from './types/auth';
import type { User } from './types/user';

/**
 * Debug interface for testing - exposes app state in a framework-agnostic way.
 * Tests use this instead of directly accessing localStorage or internal state.
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
