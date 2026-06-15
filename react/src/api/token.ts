/**
 * JWT token storage. Mirrors Angular's JwtService — stores the token under the
 * `jwtToken` key in localStorage so it stays compatible with existing sessions
 * and the e2e debug helpers.
 */
const KEY = 'jwtToken';

export function getToken(): string | null {
  return window.localStorage.getItem(KEY);
}

export function saveToken(token: string): void {
  window.localStorage.setItem(KEY, token);
}

export function destroyToken(): void {
  window.localStorage.removeItem(KEY);
}
