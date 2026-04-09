const TOKEN_KEY = "jwtToken";

export function getToken(): string | null {
  return window.localStorage[TOKEN_KEY] || null;
}

export function saveToken(token: string): void {
  window.localStorage[TOKEN_KEY] = token;
}

export function destroyToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}
