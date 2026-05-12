import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwtService {
  getToken(): string {
    return globalThis.localStorage['jwtToken'];
  }

  saveToken(token: string): void {
    globalThis.localStorage['jwtToken'] = token;
  }

  destroyToken(): void {
    globalThis.localStorage.removeItem('jwtToken');
  }
}
