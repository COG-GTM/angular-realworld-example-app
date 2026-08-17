# Dependency Upgrade — Phase 0 Manifest

Date: 2026-08-17. Branch: `upgrade/baseline`.

## Baseline state (before any upgrade)

| Check                   | Result                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install`           | OK (`husky install` prints DEPRECATED warning)                                                                                                                                                                                                                                              |
| `bun run build`         | PASS                                                                                                                                                                                                                                                                                        |
| `bun run test -- --run` | **FAIL (pre-existing)** — all 6 spec files fail to load: `Failed to resolve import "zone.js"`. `zone.js` is not in `package.json` and is not installed; `src/test-setup.ts` imports `zone.js` and `zone.js/testing`. The app itself is zoneless.                                            |
| `bun run test:e2e`      | **6 failures (pre-existing)** — all in `e2e/settings.spec.ts` (Settings - Profile Updates: bio only, image only, bio+image, bio on profile page, image on profile page, navigate to settings again). 115 passed, 1 flaky (`comments.spec.ts` "should only allow comment author to delete"). |

These failures are pre-existing and must not be mistaken for upgrade regressions.

## Angular major decision

Latest Angular is **22.1.x** — a new major (currently on 21.1.1/21.2.4). Upgrade path is
21 -> 22 (a single major step), performed with `bunx ng update @angular/core@22 @angular/cli@22`.

Consequences documented for downstream sessions:

- **TypeScript**: `@angular/compiler-cli@22.1.2` peer is `typescript >=6.0 <6.1`. Latest published
  TypeScript is **7.0.2**, which is OUT of Angular's supported range. Session G must target
  **typescript `~6.0.3`**, not 7.x.
- **rxjs**: Angular 22 peer is `^6.5.3 || ^7.4.0` → stay on **rxjs ^7.8.2** (already latest 7.x).
- **@rx-angular**: latest `@rx-angular/cdk` is **21.1.1**, `@rx-angular/template` is **21.2.1**
  (template 21.2.1 pins cdk `21.1.1`). There is **no v22 release**; peer is `@angular/core ^21.0.0`,
  so a peer warning against Angular 22 is expected. Bun installs anyway; verify build/tests.
- **Version drift**: `@angular/core` 21.2.4 vs other `@angular/*` 21.1.1 is resolved by `ng update`,
  which moves every `@angular/*` package to one aligned 22.x version.

## Target version manifest (current -> latest target)

### dependencies

| Package                           | Current | Target                            | Owner |
| --------------------------------- | ------- | --------------------------------- | ----- |
| @angular/animations               | 21.1.1  | 22.1.2                            | A     |
| @angular/common                   | 21.1.1  | 22.1.2                            | A     |
| @angular/compiler                 | 21.1.1  | 22.1.2                            | A     |
| @angular/core                     | 21.2.4  | 22.1.2                            | A     |
| @angular/forms                    | 21.1.1  | 22.1.2                            | A     |
| @angular/platform-browser         | 21.1.1  | 22.1.2                            | A     |
| @angular/platform-browser-dynamic | 21.1.1  | 22.1.2                            | A     |
| @angular/router                   | 21.1.1  | 22.1.2                            | A     |
| @rx-angular/cdk                   | 21.0.0  | 21.1.1                            | F     |
| @rx-angular/template              | 21.0.0  | 21.2.1                            | F     |
| marked                            | ^17.0.1 | ^18.0.9                           | D     |
| rxjs                              | ^7.8.2  | ^7.8.2 (already latest supported) | G     |
| tslib                             | ^2.8.1  | ^2.8.1 (latest)                   | G     |

### devDependencies

| Package                       | Current | Target                                                                  | Owner |
| ----------------------------- | ------- | ----------------------------------------------------------------------- | ----- |
| @analogjs/vite-plugin-angular | ^2.2.2  | ^2.7.0                                                                  | E     |
| @angular/build                | 21.1.1  | 22.1.4                                                                  | A     |
| @angular/cli                  | 21.1.1  | 22.1.4                                                                  | A     |
| @angular/compiler-cli         | 21.1.1  | 22.1.2                                                                  | A     |
| @playwright/test              | ^1.58.0 | ^1.62.1                                                                 | B     |
| playwright                    | ^1.58.0 | ^1.62.1                                                                 | B     |
| @types/marked                 | ^6.0.0  | **removed** (marked ships its own types)                                | D     |
| @vitest/ui                    | ^4.0.18 | ^4.1.10                                                                 | E     |
| vitest                        | ^4.0.18 | ^4.1.10                                                                 | E     |
| jsdom                         | ^27.4.0 | ^30.0.1                                                                 | E     |
| husky                         | ^9.1.7  | ^9.1.7 (already latest; `prepare` must drop deprecated `husky install`) | C     |
| lint-staged                   | ^16.2.7 | ^17.3.0                                                                 | C     |
| prettier                      | ^3.8.1  | ^3.9.6                                                                  | C     |
| typescript                    | ~5.9.3  | **~6.0.3** (capped by Angular 22 peer `>=6.0 <6.1`)                     | G     |

### engines

`node >=20.11.1` -> **`>=22.22.3`** (Angular CLI 22 refuses to run on Node 20; lint-staged 17 also
declares `node >=22.22.1`).

## Phase 3 — integration result

All seven branches merged into `upgrade/integration`. Conflicts were confined to `package.json` and
`bun.lock`; each session's dependency lines were taken and `bun.lock` regenerated from scratch with
`bun install`.

Deviations from the plan above:

- `typescript` moved to `~6.0.3` on the Angular branch (Session A) because `ng update` requires it —
  Session G confirmed it is the newest version inside Angular 22's `>=6.0 <6.1` peer range.
- `@vitest/coverage-v8 ^4.1.10` added (Session E): `bun run test:coverage` was failing with a missing
  dependency.
- `src/test-setup.ts` migrated off zone.js to the zoneless Angular testing API, and the per-spec
  zone.js imports / duplicate `initTestEnvironment` blocks were removed. This fixes the pre-existing
  red unit-test suite.
- Angular migrations applied: `withXhr()` added to `provideHttpClient`, `$safeNavigationMigration()`
  wrapper in `article.component.html`, `extendedDiagnostics` suppressions in `tsconfig.app.json`,
  deprecated `baseUrl` removed from `tsconfig.json` (TS 6.0 error TS5101).
- `marked` v18 migration: static named import in `markdown.pipe.ts`, `@types/marked` removed.
- husky modernized: `prepare` is now `husky` (not the deprecated `husky install`) and `.husky/pre-commit`
  no longer contains the legacy `husky.sh` shim that would fail in husky v10.

Final verification on `upgrade/integration` (Node 22.23.2):

| Check                       | Result                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `bun run build`             | PASS                                                                                     |
| `bun run test -- --run`     | PASS — 6/6 files, 180/180 tests (was fully red at baseline)                              |
| `bun run test:coverage`     | PASS — 83.83% statements                                                                 |
| `bun run test:e2e`          | 116 passed, 6 failed — the same pre-existing `e2e/settings.spec.ts` failures as baseline |
| `bun run test:e2e:security` | PASS — 16/16                                                                             |
| `bun run format:check`      | PASS                                                                                     |
