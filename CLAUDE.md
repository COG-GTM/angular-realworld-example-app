# React RealWorld Example App

A React + TypeScript + Vite implementation of the [RealWorld](https://realworld.show)
spec ("Conduit"). It talks to the hosted demo API at `https://api.realworld.show/api`.

## Commands

```bash
bun run setup         # Init submodules + install deps (run after clone or after realworld submodule update)
bun run start         # Vite dev server at localhost:4200
bun run build         # Production build to dist/
bun run test          # Unit tests (Vitest)
bun run test:e2e      # E2E tests (Playwright)
bun run format        # Format code with Prettier
bun run format:check  # Check formatting without writing
```

> The repo's package scripts are runner-agnostic — `npm run <script>` works too if
> you don't have Bun installed.

## Architecture

- `src/api/` — `fetch`-based API client (`client.ts`) + resource modules. The client
  prepends the API base URL, attaches the `Authorization: Token <jwt>` header,
  normalizes errors to `{ errors, status }`, and triggers logout on a global 401.
- `src/auth/` — `AuthProvider` React context: auth state machine
  (`loading`/`authenticated`/`unauthenticated`/`unavailable`), token validation on
  startup, and the `window.__conduit_debug__` test interface.
- `src/components/`, `src/pages/` — UI components and routed pages (react-router v6).
- Theme CSS and media SVGs come from the `realworld` git submodule; the SVGs are
  copied to `/assets` by `vite-plugin-static-copy`.

## Code Style

- Run `bun run format` before presenting code to the user.

## Debug Interface

E2E tests use `window.__conduit_debug__` to access app state (see
`e2e/helpers/debug.ts`). It is implemented in `src/auth/AuthContext.tsx`.
