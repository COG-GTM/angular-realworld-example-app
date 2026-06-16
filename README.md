# ![React Example App](logo.png)

> ### React codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.show) spec and API.

### [RealWorld](https://realworld.show)

This codebase was created to demonstrate a fully fledged application built with React that interacts with an actual backend server including CRUD operations, authentication, routing, pagination, and more.

It is built with [Vite](https://vitejs.dev/), [React](https://react.dev/), TypeScript and [React Router](https://reactrouter.com/), using a small fetch-based API client and a React context for authentication state.

# How it works

A global documentation for the project is available at [docs.realworld.show](https://docs.realworld.show/introduction/).

# Getting started

Requires [Bun](https://bun.sh/docs/installation).

```bash
git clone https://github.com/realworld-apps/react-realworld-example-app.git
cd react-realworld-example-app
bun run setup  # Init submodules + install dependencies
bun run start
```

Run `bun run setup` again after a `git pull` that updates the `realworld` submodule.

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
  api/         fetch-based API client (base URL, JWT header, error normalization)
  auth/        AuthContext, JWT storage, route guards, debug interface
  services/    thin wrappers around the RealWorld API endpoints
  shared/      ListErrors, defaultImage, Markdown (sanitized) utilities
  components/  ArticleMeta, ArticlePreview, ArticleList, Favorite/Follow buttons, ArticleComment
  layout/      Header, Footer
  pages/       Home, Auth, Settings, Editor, Article, Profile (+ articles/favorites)
```

## License

- **Project code**: [MIT License](LICENSE)
