# Angular RealWorld Example App

## Commands

```bash
bun run setup         # Init submodules + install deps (run after clone or after realworld submodule update)
bun run start         # Dev server at localhost:4200
bun run test          # Unit tests (Vitest)
bun run test:e2e      # E2E tests (Playwright)
bun run format        # Format code with Prettier
bun run format:check  # Check formatting without writing
```

## Code Style

- Run `bun run format` before presenting code to the user.

## Debug Interface

E2E tests use `window.__conduit_debug__` to access app state. See `e2e/helpers/debug.ts` for helpers and implementation examples for Angular/React/Vue.

It exposes the session JWT and current user, so it is installed only in development builds (`isDevMode()` guard in `src/app/app.config.ts`). Run e2e tests against the dev server (`bun run start`); a production build has no debug interface.
