# Conduit (Angular RealWorld) Documentation

Developer documentation for this Angular implementation of the [RealWorld](https://realworld.show) spec ("Conduit"). It covers the architecture, core services, feature modules, shared UI, testing strategy, and build/deployment pipeline.

> This documentation is generated from the project's [DeepWiki](https://deepwiki.com/realworld-apps/angular-realworld-example-app) and kept in-repo for offline reference.

## Contents

- [1 Overview](1-overview.md)
- [2 Getting Started](2-getting-started.md)
- [3 Architecture](3-architecture.md)
  - [3.1 Application Bootstrap & Configuration](3.1-application-bootstrap-and-configuration.md)
  - [3.2 HTTP Request Pipeline](3.2-http-request-pipeline.md)
  - [3.3 Authentication System](3.3-authentication-system.md)
  - [3.4 Routing System](3.4-routing-system.md)
- [4 Core Services](4-core-services.md)
  - [4.1 UserService & Authentication State](4.1-userservice-and-authentication-state.md)
  - [4.2 HTTP Interceptors](4.2-http-interceptors.md)
  - [4.3 JwtService & Token Storage](4.3-jwtservice-and-token-storage.md)
  - [4.4 Domain Services (Articles, Comments, Profile, Tags)](4.4-domain-services-articles-comments-profile-tags.md)
- [5 Feature Modules](5-feature-modules.md)
  - [5.1 Articles Feature](5.1-articles-feature.md)
    - [5.1.1 Article List & Pagination](5.1.1-article-list-and-pagination.md)
    - [5.1.2 Article Detail & Comments](5.1.2-article-detail-and-comments.md)
    - [5.1.3 Article Editor](5.1.3-article-editor.md)
  - [5.2 User Profiles](5.2-user-profiles.md)
  - [5.3 Settings & Authentication UI](5.3-settings-and-authentication-ui.md)
  - [5.4 Home Page & Feed Navigation](5.4-home-page-and-feed-navigation.md)
- [6 Shared Components & Directives](6-shared-components-and-directives.md)
  - [6.1 Layout Components](6.1-layout-components.md)
  - [6.2 Interactive Buttons (Favorite & Follow)](6.2-interactive-buttons-favorite-and-follow.md)
  - [6.3 Conditional Rendering & Error Display](6.3-conditional-rendering-and-error-display.md)
- [7 Testing Strategy](7-testing-strategy.md)
  - [7.1 Unit Testing with Vitest](7.1-unit-testing-with-vitest.md)
  - [7.2 E2E Testing Infrastructure](7.2-e2e-testing-infrastructure.md)
  - [7.3 Error Handling Tests](7.3-error-handling-tests.md)
  - [7.4 Feature E2E Tests](7.4-feature-e2e-tests.md)
- [8 Build & Deployment](8-build-and-deployment.md)
  - [8.1 Build Configuration](8.1-build-configuration.md)
  - [8.2 CI/CD Pipeline](8.2-ci-cd-pipeline.md)
  - [8.3 Dependencies & Package Management](8.3-dependencies-and-package-management.md)
