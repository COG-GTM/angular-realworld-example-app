import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from './header.component';
import { UserService } from '../auth/services/user.service';
import { User } from '../auth/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let currentUserSubject: BehaviorSubject<User | null>;
  let authStateSubject: BehaviorSubject<string>;

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(null);
    authStateSubject = new BehaviorSubject<string>('unauthenticated');

    TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser: currentUserSubject.asObservable(),
            authState: authStateSubject.asObservable(),
            isAuthenticated: currentUserSubject.pipe(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have currentUser$ observable', () => {
    expect(component.currentUser$).toBeDefined();
  });

  it('should have authState$ observable', () => {
    expect(component.authState$).toBeDefined();
  });

  it('should render the header element', () => {
    fixture.detectChanges();
    const headerEl = fixture.nativeElement as HTMLElement;
    expect(headerEl).toBeTruthy();
  });

  it('should emit current user when authenticated', async () => {
    currentUserSubject.next(mockUser);
    const user = await firstValueFrom(component.currentUser$);
    expect(user!.username).toBe('testuser');
  });

  it('should emit null when not authenticated', async () => {
    const user = await firstValueFrom(component.currentUser$);
    expect(user).toBeNull();
  });
});
