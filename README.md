# ![React Example App](logo.png)

> ### React + TypeScript codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.show) spec and API.

### [RealWorld](https://realworld.show)

This codebase was created to demonstrate a fully fledged application built with [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev) that interacts with an actual backend server including CRUD operations, authentication, routing, pagination, and more.

> This app was migrated from Angular to React. The build tool is Vite, routing uses [React Router](https://reactrouter.com), state is managed with React Context + hooks, and data fetching uses the native `fetch` API with `AbortController` for cancellation.

# How it works

A global documentation for the project is available at [docs.realworld.show](https://docs.realworld.show/introduction/).

# Getting started

Requires [Bun](https://bun.sh/docs/installation).

```bash
git clone https://github.com/realworld-apps/angular-realworld-example-app.git
cd angular-realworld-example-app
bun run setup  # Init submodules + install dependencies
bun run start  # Vite dev server at http://localhost:4200
```

Run `bun run setup` again after a `git pull` that updates the `realworld` submodule.

### Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `bun run start`        | Start the Vite dev server (`localhost:4200`)    |
| `bun run build`        | Type-check (`tsc -b`) and build to `dist/`      |
| `bun run test`         | Run unit tests (Vitest + Testing Library)       |
| `bun run test:e2e`     | Run the framework-agnostic Playwright e2e suite |
| `bun run format`       | Format the codebase with Prettier               |
| `bun run format:check` | Check formatting without writing                |

### Building the project

Run `bun run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Functionality overview

The example application is a social blogging site (i.e. a Medium.com clone) called "Conduit". It uses a custom API for all requests, including authentication. You can view a live demo over at [demo.realworld.show](https://demo.realworld.show)

**General functionality:**

- Authenticate users via JWT (login/signup pages + logout button on settings page)
- CRU\* users (sign up & settings page - no deleting required)
- CRUD Articles
- CR\*D Comments on articles (no updating required)
- GET and display paginated lists of articles
- Favorite articles
- Follow other users

**The general page breakdown looks like this:**

- Home page (URL: / )
  - List of tags
  - List of articles pulled from either Feed, Global, or by Tag
  - Pagination for list of articles
- Sign in/Sign up pages (URL: /login, /register )
  - Uses JWT (store the token in localStorage)
  - Authentication can be easily switched to session/cookie based
- Settings page (URL: /settings )
- Editor page to create/edit articles (URL: /editor, /editor/article-slug-here )
- Article page (URL: /article/article-slug-here )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)
- Profile page (URL: /profile/:username, /profile/:username/favorites )
  - Show basic user info
  - List of articles populated from author's created articles or author's favorited articles

## Project structure

```
src/
├── types/        # TypeScript interfaces (User, Article, Comment, Profile, ...)
├── services/     # API client + data services (fetch/async-await)
├── context/      # React Context providers (AuthContext)
├── components/   # Reusable UI components + route guards
├── pages/        # Route-level page components
├── utils/        # Utility functions (formatters, ex-Angular pipes)
├── App.tsx       # Router + app shell
└── main.tsx      # Entry point
```

## License

- **Project code**: [MIT License](LICENSE)
