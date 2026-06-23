// Mirrors Angular's JwtService: token persisted in localStorage under 'jwtToken'.
export function getToken(): string | null {
  return window.localStorage['jwtToken'] ?? null;
}

export function saveToken(token: string): void {
  window.localStorage['jwtToken'] = token;
}

export function destroyToken(): void {
  window.localStorage.removeItem('jwtToken');
}
