# ![Conduit](logo.png)

> ### React + TypeScript + Vite codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.show) spec and API.

### [RealWorld](https://realworld.show)

This codebase was created to demonstrate a fully fledged application built with **React 19 + TypeScript + Vite** that interacts with an actual backend server including CRUD operations, authentication, routing, pagination, and more.

Migrated from the [Angular RealWorld Example App](https://github.com/realworld-apps/angular-realworld-example-app).

# How it works

The React app lives in `react-app/` and uses:

- **React 19** with functional components and hooks
- **TypeScript** for type safety
- **Vite** for fast development and builds
- **React Router v6** for client-side routing
- **React Context** for auth state management
- **fetch API** with `AbortController` for data fetching
- **marked** + **DOMPurify** for markdown rendering
- **Vitest** + **React Testing Library** for testing

# Getting started

```bash
cd react-app
npm install
npm run dev
```

### Building the project

```bash
cd react-app
npm run build
```

### Running tests

```bash
cd react-app
npm test
```

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

## Project Structure

```
react-app/src/
├── types/          # TypeScript interfaces
├── services/       # API services (fetch-based)
├── context/        # React Context (AuthContext)
├── components/     # Reusable UI components
├── pages/          # Route-level page components
├── utils/          # Utility functions
├── styles/         # Global CSS
├── App.tsx         # Router and layout
└── main.tsx        # Entry point
```

## License

- **Project code**: [MIT License](LICENSE)
