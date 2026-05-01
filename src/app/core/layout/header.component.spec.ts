import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HeaderComponent } from './header.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../auth/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { User } from '../auth/user.model';
import { AuthState } from '../auth/services/user.service';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let userSubject: BehaviorSubject<User | null>;
  let authStateSubject: BehaviorSubject<AuthState>;

  const mockUser: User = {
    email: 'test@test.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'test bio',
    image: 'http://example.com/avatar.png',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    userSubject = new BehaviorSubject<User | null>(null);
    authStateSubject = new BehaviorSubject<AuthState>('loading');

    TestBed.configureTestingModule({
      imports: [HeaderComponent, RouterTestingModule],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser: userSubject.asObservable().pipe(distinctUntilChanged()),
            authState: authStateSubject.asObservable().pipe(distinctUntilChanged()),
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

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render navbar', () => {
    const nav = fixture.debugElement.query(By.css('nav.navbar'));
    expect(nav).toBeTruthy();
  });

  it('should render brand logo link', () => {
    const brand = fixture.debugElement.query(By.css('a.navbar-brand'));
    expect(brand).toBeTruthy();
  });

  describe('when auth state is loading', () => {
    beforeEach(() => {
      authStateSubject.next('loading');
      fixture.detectChanges();
    });

    it('should show loading text', () => {
      const navLinks = fixture.debugElement.queryAll(By.css('.nav-link'));
      const loadingLink = navLinks.find(el => el.nativeElement.textContent.includes('Loading...'));
      expect(loadingLink).toBeTruthy();
    });
  });

  describe('when user is unauthenticated', () => {
    beforeEach(() => {
      authStateSubject.next('unauthenticated');
      userSubject.next(null);
      fixture.detectChanges();
    });

    it('should show Sign in link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const signInLink = links.find(el => el.nativeElement.textContent.includes('Sign in'));
      expect(signInLink).toBeTruthy();
    });

    it('should show Sign up link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const signUpLink = links.find(el => el.nativeElement.textContent.includes('Sign up'));
      expect(signUpLink).toBeTruthy();
    });

    it('should not show New Article link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const newArticleLink = links.find(el => el.nativeElement.textContent.includes('New Article'));
      expect(newArticleLink).toBeUndefined();
    });

    it('should not show Settings link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const settingsLink = links.find(el => el.nativeElement.textContent.includes('Settings'));
      expect(settingsLink).toBeUndefined();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      authStateSubject.next('authenticated');
      userSubject.next(mockUser);
      fixture.detectChanges();
    });

    it('should show New Article link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const newArticleLink = links.find(el => el.nativeElement.textContent.includes('New Article'));
      expect(newArticleLink).toBeTruthy();
    });

    it('should show Settings link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const settingsLink = links.find(el => el.nativeElement.textContent.includes('Settings'));
      expect(settingsLink).toBeTruthy();
    });

    it('should display the username', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const profileLink = links.find(el => el.nativeElement.textContent.includes(mockUser.username));
      expect(profileLink).toBeTruthy();
    });

    it('should display user avatar', () => {
      const img = fixture.debugElement.query(By.css('.user-pic'));
      expect(img).toBeTruthy();
    });

    it('should not show Sign in link', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const signInLink = links.find(el => el.nativeElement.textContent.includes('Sign in'));
      expect(signInLink).toBeUndefined();
    });
  });

  describe('when auth state is unavailable', () => {
    beforeEach(() => {
      authStateSubject.next('unavailable');
      fixture.detectChanges();
    });

    it('should show Connecting... text', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const connectingLink = links.find(el => el.nativeElement.textContent.includes('Connecting...'));
      expect(connectingLink).toBeTruthy();
    });

    it('should still show New Article and Settings links', () => {
      const links = fixture.debugElement.queryAll(By.css('.nav-link'));
      const newArticleLink = links.find(el => el.nativeElement.textContent.includes('New Article'));
      const settingsLink = links.find(el => el.nativeElement.textContent.includes('Settings'));
      expect(newArticleLink).toBeTruthy();
      expect(settingsLink).toBeTruthy();
    });
  });
});
