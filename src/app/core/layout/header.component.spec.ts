import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { HeaderComponent } from './header.component';
import { UserService, AuthState } from '../auth/services/user.service';
import { User } from '../auth/user.model';

describe('HeaderComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authStateSubject: BehaviorSubject<AuthState>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    authStateSubject = new BehaviorSubject<AuthState>('loading');
    currentUserSubject = new BehaviorSubject<User | null>(null);

    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: {
            authState: authStateSubject.asObservable(),
            currentUser: currentUserSubject.asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state initially', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading...');
  });

  it('should show Sign in and Sign up for unauthenticated users', () => {
    authStateSubject.next('unauthenticated');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Sign in');
    expect(el.textContent).toContain('Sign up');
  });

  it('should show New Article and Settings for authenticated users', () => {
    authStateSubject.next('authenticated');
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('New Article');
    expect(el.textContent).toContain('Settings');
  });

  it('should show username for authenticated users', () => {
    authStateSubject.next('authenticated');
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('testuser');
  });

  it('should not show Sign in/Sign up for authenticated users', () => {
    authStateSubject.next('authenticated');
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Sign in');
    expect(el.textContent).not.toContain('Sign up');
  });

  it('should show Connecting... for unavailable auth state', () => {
    authStateSubject.next('unavailable');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Connecting...');
  });

  it('should show Home link in all states', () => {
    for (const state of ['loading', 'unauthenticated', 'authenticated', 'unavailable'] as AuthState[]) {
      authStateSubject.next(state);
      if (state === 'authenticated') {
        currentUserSubject.next(mockUser);
      }
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Home');
    }
  });

  it('should show navbar-brand logo', () => {
    const el: HTMLElement = fixture.nativeElement;
    const logo = el.querySelector('.navbar-brand img');
    expect(logo).toBeTruthy();
  });
});
