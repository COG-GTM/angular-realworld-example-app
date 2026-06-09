/**
 * JWT token storage. Mirrors the Angular JwtService and uses the same
 * localStorage key ("jwtToken") so the e2e debug contract is preserved.
 */
const TOKEN_KEY = 'jwtToken';

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function destroyToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
