/// <reference types="vite/client" />

import { User, AuthState } from './models';

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getAuthState: () => AuthState;
      getCurrentUser: () => User | null;
    };
  }
}
