import { Injectable } from '@angular/core';

const JWT_TOKEN_KEY = 'jwtToken';

@Injectable({ providedIn: 'root' })
export class JwtService {
  getToken(): string {
    return window.localStorage.getItem(JWT_TOKEN_KEY) ?? '';
  }

  saveToken(token: string): void {
    window.localStorage.setItem(JWT_TOKEN_KEY, token);
  }

  destroyToken(): void {
    window.localStorage.removeItem(JWT_TOKEN_KEY);
  }
}
