import { inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE } from './storage.token';

@Injectable({ providedIn: 'root' })
export class JwtService {
  private storage = inject(LOCAL_STORAGE);

  getToken(): string {
    return this.storage.getItem('jwtToken') ?? '';
  }

  saveToken(token: string): void {
    this.storage.setItem('jwtToken', token);
  }

  destroyToken(): void {
    this.storage.removeItem('jwtToken');
  }
}
