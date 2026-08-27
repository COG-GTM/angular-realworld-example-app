import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FooterComponent } from './footer.component';
import { HeaderComponent } from './header.component';
import { UserService, AuthState } from '../auth/services/user.service';
import { User } from '../auth/user.model';

describe('layout components', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('FooterComponent', () => {
    it('should render the current year', async () => {
      await TestBed.configureTestingModule({
        imports: [FooterComponent],
        providers: [provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(FooterComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.today).toBeGreaterThan(0);
      expect(fixture.nativeElement.textContent).toContain(String(new Date().getFullYear()));
    });
  });

  describe('HeaderComponent', () => {
    const mockUser: User = {
      email: 'test@example.com',
      token: 'token',
      username: 'testuser',
      bio: '',
      image: null as unknown as string,
    };

    function setup(user: User | null, authState: AuthState) {
      const userService = {
        currentUser: new BehaviorSubject<User | null>(user),
        authState: new BehaviorSubject<AuthState>(authState),
      };
      TestBed.configureTestingModule({
        imports: [HeaderComponent],
        providers: [provideRouter([]), { provide: UserService, useValue: userService }],
      });
      return TestBed.createComponent(HeaderComponent);
    }

    it('should show the username when authenticated', async () => {
      const fixture = setup(mockUser, 'authenticated');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('testuser');
    });

    it('should show sign in link when unauthenticated', async () => {
      const fixture = setup(null, 'unauthenticated');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Sign in');
    });
  });
});
