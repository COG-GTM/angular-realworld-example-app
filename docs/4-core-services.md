# Core Services

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

- [LICENSE](../LICENSE)
- [README.md](../README.md)
- [e2e/settings.spec.ts](../e2e/settings.spec.ts)
- [src/app/core/auth/services/jwt.service.ts](../src/app/core/auth/services/jwt.service.ts)
- [src/app/core/auth/services/user.service.ts](../src/app/core/auth/services/user.service.ts)
- [src/app/core/interceptors/api.interceptor.ts](../src/app/core/interceptors/api.interceptor.ts)
- [src/app/core/interceptors/token.interceptor.ts](../src/app/core/interceptors/token.interceptor.ts)
- [src/app/core/layout/footer.component.html](../src/app/core/layout/footer.component.html)
- [src/app/core/layout/footer.component.ts](../src/app/core/layout/footer.component.ts)

</details>

## Purpose and Scope

Core Services provide cross-cutting infrastructure functionality that is used throughout the application. These services handle authentication state management, HTTP communication, token storage, and API interactions. They form the foundation layer that all feature modules depend on.

This page provides an overview of the core services architecture and how they interact. For detailed documentation:

- Authentication state management and error handling: see [UserService & Authentication State](4.1-userservice-and-authentication-state.md)
- HTTP interceptor chain implementation: see [HTTP Interceptors](4.2-http-interceptors.md)
- Token persistence and lifecycle: see [JwtService & Token Storage](4.3-jwtservice-and-token-storage.md)
- API services for articles, comments, profiles, and tags: see [Domain Services](4.4-domain-services-articles-comments-profile-tags.md)

---

## Service Categories

Core services are organized into two categories:

### Infrastructure Services

| Service            | Location                                         | Responsibility                                           |
| ------------------ | ------------------------------------------------ | -------------------------------------------------------- |
| `UserService`      | `src/app/core/auth/services/user.service.ts`     | Authentication state management, user profile operations |
| `JwtService`       | `src/app/core/auth/services/jwt.service.ts`      | JWT token persistence in `localStorage`                  |
| `apiInterceptor`   | `src/app/core/interceptors/api.interceptor.ts`   | Prepend base URL to all HTTP requests                    |
| `tokenInterceptor` | `src/app/core/interceptors/token.interceptor.ts` | Inject JWT token into request headers                    |
| `errorInterceptor` | Referenced in diagrams                           | Normalize errors and handle 401 responses                |

### Domain Services

| Service           | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `ArticlesService` | Article CRUD operations, favorites, queries with filters |
| `CommentsService` | Comment creation, deletion, and retrieval                |
| `ProfileService`  | User profile retrieval, follow/unfollow operations       |
| `TagsService`     | Retrieve available article tags                          |

Domain services are documented in detail in [Domain Services](4.4-domain-services-articles-comments-profile-tags.md).

**Sources:** `src/app/core/auth/services/user.service.ts:1-181`, `src/app/core/auth/services/jwt.service.ts:1-16`, `src/app/core/interceptors/api.interceptor.ts:1-6`, `src/app/core/interceptors/token.interceptor.ts:1-14`

---

## Core Services Architecture

The following diagram maps core services to their file locations and responsibilities:

```mermaid
graph TB
    subgraph "Infrastructure Services"
        UserService["UserService<br/>user.service.ts"]
        JwtService["JwtService<br/>jwt.service.ts"]
        ApiInterceptor["apiInterceptor<br/>api.interceptor.ts"]
        TokenInterceptor["tokenInterceptor<br/>token.interceptor.ts"]
        ErrorInterceptor["errorInterceptor<br/>error.interceptor.ts"]
    end

    subgraph "Domain Services"
        ArticlesService["ArticlesService<br/>articles.service.ts"]
        CommentsService["CommentsService<br/>comments.service.ts"]
        ProfileService["ProfileService<br/>profile.service.ts"]
        TagsService["TagsService<br/>tags.service.ts"]
    end

    subgraph "External Dependencies"
        HttpClient["Angular HttpClient"]
        LocalStorage["window.localStorage"]
        API["api.realworld.show/api"]
    end

    UserService --> HttpClient
    UserService --> JwtService
    JwtService --> LocalStorage

    ArticlesService --> HttpClient
    CommentsService --> HttpClient
    ProfileService --> HttpClient
    TagsService --> HttpClient

    HttpClient --> ApiInterceptor
    ApiInterceptor --> TokenInterceptor
    TokenInterceptor --> JwtService
    TokenInterceptor --> ErrorInterceptor
    ErrorInterceptor --> UserService
    ErrorInterceptor --> API
```

**Sources:** `src/app/core/auth/services/user.service.ts:1-10`, `src/app/core/auth/services/jwt.service.ts:1-4`, `src/app/core/interceptors/api.interceptor.ts:1-6`, `src/app/core/interceptors/token.interceptor.ts:1-14`

---

## HTTP Request Pipeline

Every HTTP request flows through the interceptor chain in this order:

```mermaid
sequenceDiagram
    participant Component as "Component/Service"
    participant HttpClient as "HttpClient"
    participant apiInterceptor as "apiInterceptor"
    participant tokenInterceptor as "tokenInterceptor"
    participant errorInterceptor as "errorInterceptor"
    participant JwtService as "JwtService"
    participant UserService as "UserService"
    participant API as "api.realworld.show/api"

    Component->>HttpClient: "HTTP request"
    HttpClient->>apiInterceptor: "req"

    Note over apiInterceptor: "Prepend 'https://api.realworld.show/api'"

    apiInterceptor->>tokenInterceptor: "modified req"
    tokenInterceptor->>JwtService: "getToken()"
    JwtService-->>tokenInterceptor: "token or empty string"

    alt "Token exists"
        Note over tokenInterceptor: "Add Authorization: Token {jwt}"
    end

    tokenInterceptor->>errorInterceptor: "req with auth header"
    errorInterceptor->>API: "final request"

    alt "401 Unauthorized (not /user endpoint)"
        API-->>errorInterceptor: "401 response"
        errorInterceptor->>UserService: "purgeAuth()"
        Note over UserService: "Clear token, logout"
    else "Other error"
        API-->>errorInterceptor: "error response"
        Note over errorInterceptor: "Normalize error format"
    end

    errorInterceptor-->>Component: "response or normalized error"
```

### Interceptor Responsibilities

**`apiInterceptor`** `src/app/core/interceptors/api.interceptor.ts:3-5`

- Prepends `https://api.realworld.show/api` to all request URLs
- Enables relative URLs throughout the application (e.g., `/user`, `/articles`)

**`tokenInterceptor`** `src/app/core/interceptors/token.interceptor.ts:5-13`

- Retrieves JWT token from `JwtService`
- Adds `Authorization: Token {jwt}` header if token exists
- Uses functional interceptor pattern with `inject(JwtService)`

**`errorInterceptor`** (referenced in system diagrams)

- Normalizes error response formats
- Handles 401 responses by calling `UserService.purgeAuth()` (except for `/user` endpoint)
- Distinguishes between client errors (4xx) and server errors (5xx)

**Sources:** `src/app/core/interceptors/api.interceptor.ts:1-6`, `src/app/core/interceptors/token.interceptor.ts:1-14`

---

## Authentication State Management

The `UserService` manages authentication state through RxJS observables:

```mermaid
stateDiagram-v2
    [*] --> loading: "App starts with token in localStorage"
    [*] --> unauthenticated: "App starts without token"

    loading --> authenticated: "GET /user returns 200 OK<br/>setAuth(user)"
    loading --> unauthenticated: "GET /user returns 4xx<br/>purgeAuth()"
    loading --> unavailable: "GET /user returns 5xx<br/>setAuthUnavailable()"

    unauthenticated --> loading: "login(credentials)<br/>register(credentials)"

    authenticated --> unauthenticated: "logout()<br/>purgeAuth() called by errorInterceptor"

    unavailable --> loading: "scheduleRetry() triggers retry"
    unavailable --> authenticated: "Retry succeeds<br/>setAuth(user)"
    unavailable --> unavailable: "Retry fails 5xx<br/>scheduleRetry() again"

    note right of loading
        authStateSubject: 'loading'
        currentUserSubject: null
    end note

    note right of authenticated
        authStateSubject: 'authenticated'
        currentUserSubject: User object
    end note

    note right of unauthenticated
        authStateSubject: 'unauthenticated'
        currentUserSubject: null
        Token destroyed
    end note

    note right of unavailable
        authStateSubject: 'unavailable'
        currentUserSubject: null
        Token RETAINED for retry
        Exponential backoff: 2s, 4s, 8s, 16s
    end note
```

### Observable Streams

The `UserService` exposes three main observables:

| Observable        | Type                       | Purpose                                                                                          |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `currentUser`     | `Observable<User \| null>` | Current user object or null                                                                      |
| `authState`       | `Observable<AuthState>`    | Authentication state: `'loading'` \| `'authenticated'` \| `'unauthenticated'` \| `'unavailable'` |
| `isAuthenticated` | `Observable<boolean>`      | Derived from `currentUser`                                                                       |

**Implementation details:**

```typescript
// From user.service.ts:49-55
private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser = this.currentUserSubject.asObservable().pipe(distinctUntilChanged());

private authStateSubject = new BehaviorSubject<AuthState>('loading');
public authState = this.authStateSubject.asObservable().pipe(distinctUntilChanged());

public isAuthenticated = this.currentUser.pipe(map(user => !!user));
```

**Sources:** `src/app/core/auth/services/user.service.ts:10-10`, `src/app/core/auth/services/user.service.ts:49-55`, `src/app/core/auth/services/user.service.ts:100-180`

---

## Token Management Flow

The collaboration between `UserService` and `JwtService`:

```mermaid
sequenceDiagram
    participant User as "User Action"
    participant Component as "Component"
    participant UserService as "UserService"
    participant JwtService as "JwtService"
    participant HttpClient as "HttpClient"
    participant LocalStorage as "localStorage"
    participant Interceptor as "tokenInterceptor"

    Note over User,LocalStorage: "Login Flow"
    User->>Component: "Submit login form"
    Component->>UserService: "login(credentials)"
    UserService->>HttpClient: "POST /users/login"
    HttpClient-->>UserService: "{user: User} with token"
    UserService->>UserService: "setAuth(user)"
    UserService->>JwtService: "saveToken(user.token)"
    JwtService->>LocalStorage: "localStorage['jwtToken'] = token"
    UserService->>UserService: "currentUserSubject.next(user)"
    UserService->>UserService: "authStateSubject.next('authenticated')"

    Note over User,LocalStorage: "Subsequent Requests"
    Component->>HttpClient: "GET /articles"
    HttpClient->>Interceptor: "Request without auth"
    Interceptor->>JwtService: "getToken()"
    JwtService->>LocalStorage: "Read localStorage['jwtToken']"
    LocalStorage-->>JwtService: "token string"
    JwtService-->>Interceptor: "token"
    Interceptor->>Interceptor: "Add Authorization header"

    Note over User,LocalStorage: "Logout Flow"
    User->>Component: "Click logout"
    Component->>UserService: "logout()"
    UserService->>UserService: "purgeAuth()"
    UserService->>JwtService: "destroyToken()"
    JwtService->>LocalStorage: "localStorage.removeItem('jwtToken')"
    UserService->>UserService: "currentUserSubject.next(null)"
    UserService->>UserService: "authStateSubject.next('unauthenticated')"
```

### JwtService Methods

The `JwtService` provides a simple abstraction over `localStorage`:

| Method             | Implementation                                    | Purpose                                        |
| ------------------ | ------------------------------------------------- | ---------------------------------------------- |
| `getToken()`       | `src/app/core/auth/services/jwt.service.ts:5-7`   | Returns `window.localStorage['jwtToken']`      |
| `saveToken(token)` | `src/app/core/auth/services/jwt.service.ts:9-11`  | Sets `window.localStorage['jwtToken'] = token` |
| `destroyToken()`   | `src/app/core/auth/services/jwt.service.ts:13-15` | Removes `jwtToken` from `localStorage`         |

**Sources:** `src/app/core/auth/services/jwt.service.ts:1-16`, `src/app/core/auth/services/user.service.ts:166-180`, `src/app/core/interceptors/token.interceptor.ts:5-13`

---

## Error Handling Strategy

Core services distinguish between different error types:

```mermaid
graph TB
    Request["HTTP Request"]
    Response{"Response Status"}

    Request --> Response

    Response -->|"2xx Success"| Success["Return data"]
    Response -->|"4xx Client Error"| ClientError["Client Error Handler"]
    Response -->|"5xx Server Error"| ServerError["Server Error Handler"]
    Response -->|"0 Network Error"| NetworkError["Network Error Handler"]

    ClientError --> IsUserEndpoint{"Endpoint = /user?"}
    IsUserEndpoint -->|"Yes"| PurgeAuthUser["UserService.purgeAuth()<br/>Clear token<br/>authState = 'unauthenticated'"]
    IsUserEndpoint -->|"No"| PurgeAuthInterceptor["errorInterceptor calls<br/>UserService.purgeAuth()"]

    ServerError --> IsUserEndpoint2{"Endpoint = /user?"}
    IsUserEndpoint2 -->|"Yes"| SetUnavailable["UserService.setAuthUnavailable()<br/>Keep token<br/>authState = 'unavailable'<br/>scheduleRetry()"]
    IsUserEndpoint2 -->|"No"| NormalizeError["Normalize error format<br/>Return to caller"]

    NetworkError --> IsUserEndpoint3{"Endpoint = /user?"}
    IsUserEndpoint3 -->|"Yes"| SetUnavailable
    IsUserEndpoint3 -->|"No"| NormalizeError

    SetUnavailable --> RetryTimer["Exponential backoff:<br/>2s → 4s → 8s → 16s"]
    RetryTimer --> Request
```

### Error Handling Rules

**For `/user` endpoint** (handled by `UserService.handleAuthError()`):

- **4xx errors:** Token is invalid → `purgeAuth()` → logout user
- **5xx/network errors:** Server unavailable → `setAuthUnavailable()` → keep token and retry

**For other endpoints** (handled by `errorInterceptor`):

- **401 Unauthorized:** Call `UserService.purgeAuth()` → logout user
- **Other errors:** Normalize error format and return to caller

**Retry Logic** `src/app/core/auth/services/user.service.ts:129-146`:

- Exponential backoff: 2s, 4s, 8s, 16s (capped at 16 seconds)
- Continues retrying indefinitely while token exists
- Canceled when `setAuth()` succeeds or `purgeAuth()` is called

**Sources:** `src/app/core/auth/services/user.service.ts:100-156`

---

## Service Dependency Injection

All core services use Angular's `providedIn: 'root'` for tree-shakeable singleton instances:

```typescript
// user.service.ts:47
@Injectable({ providedIn: 'root' })
export class UserService { ... }

// jwt.service.ts:3
@Injectable({ providedIn: 'root' })
export class JwtService { ... }
```

This ensures:

- Single instance across the entire application
- Automatic registration in the root injector
- Tree-shaking if service is never imported
- No need for module-level providers

**Functional Interceptors** use the `inject()` function:

```typescript
// token.interceptor.ts:5-6
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(JwtService).getToken();
  // ...
};
```

This is the modern Angular standalone API pattern, replacing class-based interceptors.

**Sources:** `src/app/core/auth/services/user.service.ts:47-47`, `src/app/core/auth/services/jwt.service.ts:3-3`, `src/app/core/interceptors/token.interceptor.ts:5-6`

---

## Key Design Patterns

### Separation of Concerns

| Layer          | Responsibility                | Example                             |
| -------------- | ----------------------------- | ----------------------------------- |
| Infrastructure | Token storage, HTTP pipeline  | `JwtService`, interceptors          |
| Authentication | State management, retry logic | `UserService`                       |
| Domain         | Business operations           | `ArticlesService`, `ProfileService` |
| Presentation   | UI and user interaction       | Components                          |

### Observable-Based State Management

Core services use RxJS `BehaviorSubject` to manage state:

- **Benefits:** Synchronous access via `.getValue()`, reactive streams, distinctUntilChanged filtering
- **Pattern:** Private subject, public observable
- **Used in:** `UserService.currentUserSubject`, `UserService.authStateSubject`

### Interceptor Chain Pattern

HTTP interceptors form a middleware pipeline:

1. Each interceptor can modify the request
2. Each interceptor can observe/modify the response
3. Order matters: `apiInterceptor` → `tokenInterceptor` → `errorInterceptor`
4. Registered in `app.config.ts` via `provideHttpClient(withInterceptors([...]))`

**Sources:** `src/app/core/auth/services/user.service.ts:49-55`

---

## Testing Considerations

Core services are unit tested with:

- **`HttpClientTestingModule`**: Mock HTTP requests/responses
- **`TestBed`**: Angular dependency injection in tests
- **Service mocks**: Replace dependencies in component tests

Example test structure for services:

```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [UserService, JwtService],
  });
  httpMock = TestBed.inject(HttpTestingController);
  service = TestBed.inject(UserService);
});
```

See [Unit Testing with Vitest](7.1-unit-testing-with-vitest.md) for complete testing patterns.

**Sources:** General testing patterns from system diagrams

---

---

[← Back to documentation index](README.md)
