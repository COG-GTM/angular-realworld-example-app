# React RealWorld (Conduit) — Angular → React Migration

React 18 + Vite + TypeScript port of the Angular RealWorld example app in the repository root, talking to the same RealWorld API (`https://api.realworld.show/api`).

## Getting started

```bash
cd react
bun install
bun run start   # dev server at localhost:4300
bun run build   # production build to react/dist
```

Note: the theme CSS and media assets are loaded from the `realworld` git submodule at the repo root, so run `bun run setup` in the repo root first.

## Migration mapping

| Angular                                 | React                              |
| --------------------------------------- | ---------------------------------- |
| `UserService` + RxJS state              | `UserContext` (React context)      |
| HTTP interceptors (api/token/error)     | `src/api/client.ts` fetch wrapper  |
| `@angular/router` routes + guards       | `react-router-dom` + `RequireAuth` |
| Standalone components / templates       | Function components (JSX)          |
| `markdown` pipe (marked + DomSanitizer) | `marked` + `dompurify`             |
| `defaultImage` pipe                     | `defaultImage()` helper            |

The app also exposes the same `window.__conduit_debug__` interface used by the e2e suite.
