import { AuthState, User } from './types';

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
