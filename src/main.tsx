import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// The RealWorld theme stylesheet (sourced from the `realworld` git submodule).
import '../realworld/assets/theme/styles.css';
import './app.css';

import { App } from './App';

// NOTE: StrictMode is intentionally omitted. Its dev-only double-invocation of
// effects would fire the auth-init GET /user (and retry timers) twice against the
// Vite dev server the e2e suite runs against.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
