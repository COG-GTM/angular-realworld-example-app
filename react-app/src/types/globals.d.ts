import type { AuthState, User } from '../models';

declare global {
  interface ConduitDebug {
    getToken: () => string | null;
    getAuthState: () => AuthState;
    getCurrentUser: () => User | null;
  }

  interface Window {
    __conduit_debug__?: ConduitDebug;
  }

  /** Custom element wrappers that keep the shared theme's `app-*` selectors working. */
  interface ConduitCustomElement extends React.HTMLAttributes<HTMLElement> {
    class?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      'app-layout-header': ConduitCustomElement;
      'app-layout-footer': ConduitCustomElement;
      'app-follow-button': ConduitCustomElement;
      'app-favorite-button': ConduitCustomElement;
    }
  }
}

export {};
