# Conduit — React + TypeScript port

React 18 + TypeScript (Vite) port of the Angular RealWorld/Conduit app in this repository. The
Angular source under `src/` is untouched; this app lives side by side with it and reuses the shared
theme (`realworld/assets/theme/styles.css`) and media assets from the `realworld/` submodule.

## Scripts

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Architecture

- `src/services/api.ts` — fetch wrapper against the RealWorld API, sends `Authorization: Token <jwt>`.
- `src/services/jwt.ts` — JWT persistence in `localStorage` under the `jwtToken` key (same key as Angular).
- `src/context/AuthContext.tsx` — auth state (`loading` / `authenticated` / `anonymous`), login,
  register, settings update, logout; exposes `window.__conduit_debug__` like the Angular app.
- `src/components`, `src/pages` — mirror the Angular component tree and routes so the shared
  stylesheet (which targets Angular element selectors such as `app-favorite-button`) applies unchanged.

Visual parity against the Angular app is verified by the Playwright + pixelmatch harness in
`../visual-tests`.
