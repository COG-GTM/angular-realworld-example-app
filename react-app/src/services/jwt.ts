const TOKEN_KEY = 'jwtToken';

export const jwtService = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  saveToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  destroyToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
