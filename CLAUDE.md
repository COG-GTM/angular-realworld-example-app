# React RealWorld Example App

## Commands

```bash
npm run setup         # Init submodules + install deps (run after clone or after realworld submodule update)
npm run start         # Dev server at localhost:4200
npm run build         # TypeScript check + Vite production build
npm run lint          # TypeScript type checking (tsc --noEmit)
npm run test:e2e      # E2E tests (Playwright)
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without writing
```

## Code Style

- Run `npm run format` before presenting code to the user.

## Debug Interface

E2E tests use `window.__conduit_debug__` to access app state. See `e2e/helpers/debug.ts` for helpers and implementation examples for Angular/React/Vue.
