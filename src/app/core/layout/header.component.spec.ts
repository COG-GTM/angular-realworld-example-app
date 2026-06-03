import { initTestBed } from '../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HeaderComponent } from './header.component';
import { UserService } from '../auth/services/user.service';
import { User } from '../auth/user.model';
import { AuthState } from '../auth/services/user.service';

describe('HeaderComponent', () => {
  let currentUser$: BehaviorSubject<User | null>;
  let authState$: BehaviorSubject<AuthState>;
  let component: HeaderComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    authState$ = new BehaviorSubject<AuthState>('loading');
    TestBed.configureTestingModule({
      providers: [
        HeaderComponent,
        { provide: UserService, useValue: { currentUser: currentUser$, authState: authState$ } },
      ],
    });
    component = TestBed.inject(HeaderComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the current user observable from the service', async () => {
    const user: User = { email: 'a@b.c', token: 't', username: 'u', bio: '', image: '' };
    currentUser$.next(user);
    expect(await firstValueFrom(component.currentUser$)).toEqual(user);
  });

  it('should expose the auth state observable from the service', async () => {
    authState$.next('authenticated');
    expect(await firstValueFrom(component.authState$)).toBe('authenticated');
  });
});
