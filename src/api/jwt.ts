const TOKEN_KEY = 'jwtToken';

/**
 * JWT token storage. Mirrors the Angular `JwtService` and persists the token at
 * `localStorage['jwtToken']` (the key the e2e suite reads/writes directly).
 */
export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function destroyToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
