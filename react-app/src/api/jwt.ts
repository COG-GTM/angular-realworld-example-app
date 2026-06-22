/**
 * JWT token storage helpers. Mirrors the Angular JwtService:
 * the token is persisted under `localStorage['jwtToken']`.
 */
export function getToken(): string | null {
  return window.localStorage.getItem('jwtToken');
}

export function saveToken(token: string): void {
  window.localStorage.setItem('jwtToken', token);
}

export function destroyToken(): void {
  window.localStorage.removeItem('jwtToken');
}
