# Conduit — React (migrated from Angular)

A React + TypeScript + Vite migration of the Angular RealWorld ("Conduit") example
app that lives in `../src`. Same Conduit API (`https://api.realworld.show/api`),
same theme (`public/styles.css`), same routes and features.

## Commands

```bash
bun install      # install dependencies
bun run dev      # dev server at http://localhost:4200
bun run build    # type-check + production build
bun run lint     # eslint
bun run format   # prettier --write
```

## Architecture (Angular → React mapping)

| Angular                                         | React                                  |
| ----------------------------------------------- | -------------------------------------- |
| HTTP interceptors (`api`/`token`/`error`)       | `src/api/client.ts` (axios instance)   |
| `*.service.ts` (Articles/Comments/Tags/Profile) | `src/api/agent.ts`                     |
| `JwtService`                                    | `src/api/token.ts`                     |
| `UserService`                                   | `src/auth/AuthContext.tsx` (`useAuth`) |
| route guards                                    | `src/auth/RequireAuth.tsx`             |
| `app.routes.ts`                                 | `src/App.tsx` (`react-router-dom`)     |
| pipes (`markdown`, `defaultImage`, `date`)      | `src/lib/*`                            |
| `ListErrorsComponent`                           | `src/components/ListErrors.tsx`        |
| layout `Header`/`Footer`                        | `src/components/layout/*`              |
| `features/*` components/pages                   | `src/features/*`                       |

Auth state (`loading` / `authenticated` / `unauthenticated` / `unavailable`),
the 4XX-vs-5XX handling on `GET /user`, exponential-backoff retry, global 401
logout, and the `window.__conduit_debug__` test hook are all preserved.
