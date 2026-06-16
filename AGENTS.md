# AGENTS.md

## Cursor Cloud specific instructions

This is **Conduit**, the Angular ([RealWorld](https://realworld.show)) example app — a frontend-only Medium.com clone SPA. There is no local backend; the app talks to the hosted public API at `https://api.realworld.show/api` (hardcoded in `src/app/core/interceptors/api.interceptor.ts`), so **outbound internet access is required** for the app and E2E tests to work.

### Toolchain

- Package manager is **Bun** (`bun.lock`). Bun is preinstalled in the cloud VM (also symlinked at `/usr/local/bin/bun`). Node `>=20.11.1` is required.
- The `realworld` git submodule provides shared E2E base config (`e2e/playwright.base`). It is initialized by the startup update script; if missing, run `git submodule update --init --recursive`.

### Commands (defined in `package.json`)

- Run dev server: `bun run start` → http://localhost:4200
- Build: `bun run build`
- Lint/format check: `bun run format:check` (auto-fix with `bun run format`)
- E2E tests: `bun run test:e2e` (Playwright; security suite is `bun run test:e2e:security`)

### Non-obvious caveats

- **Unit tests (`bun run test` / Vitest) are currently broken** under the installed Bun version: spec files and `src/test-setup.ts` import `zone.js`, but `zone.js` is only an optional peer dependency of `@angular/core` and Bun no longer installs it, so every spec fails to resolve `zone.js`. There is no Vitest CI workflow; the validated automated suite is Playwright E2E. Do not try to "fix" the environment for this — it's a repo-level state.
- **E2E browsers**: Playwright needs Chromium. If E2E fails with a missing-browser error, run `bunx playwright install --with-deps chromium` (browsers are cached in the VM snapshot, so this is usually already done).
- **E2E reuses the running dev server** on port 4200 (`playwright.config.ts` `webServer.reuseExistingServer`). Its `command` is `npm run start`, but a dev server already started via `bun run start` is reused, so the `npm`/`bun` distinction doesn't matter when one is already running.
- The `settings.spec.ts` "Profile Updates" E2E tests can fail because the shared public API (`api.realworld.show`) returns `422` on `PUT /api/user`. This is a remote-backend quirk, not a local environment issue; the other ~116 E2E tests pass.
- `bun install` may rewrite `bun.lock` (it drops the optional `zone.js` entry and bumps `@angular/core` to its resolved patch). This drift is harmless; avoid committing the regenerated lockfile unless intentionally updating dependencies.
