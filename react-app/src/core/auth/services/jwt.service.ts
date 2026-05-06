export const JwtService = {
  getToken(): string | null {
    return window.localStorage.getItem('jwtToken');
  },

  saveToken(token: string): void {
    window.localStorage.setItem('jwtToken', token);
  },

  destroyToken(): void {
    window.localStorage.removeItem('jwtToken');
  },
};
