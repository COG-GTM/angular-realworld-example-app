import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Component } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { IfAuthenticatedDirective } from './if-authenticated.directive';
import { UserService } from './services/user.service';
import { User } from './user.model';

@Component({
  template: `
    <div *ifAuthenticated="true" class="auth-only">Authenticated content</div>
    <div *ifAuthenticated="false" class="unauth-only">Guest content</div>
  `,
  imports: [IfAuthenticatedDirective],
})
class HostComponent {}

describe('IfAuthenticatedDirective', () => {
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

  function setup(user: User | null) {
    const currentUser = new BehaviorSubject<User | null>(user);
    const userService = {
      currentUser,
      isAuthenticated: currentUser.pipe(map(u => !!u)),
    };
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: UserService, useValue: userService }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, currentUser };
  }

  const mockUser: User = { email: 'a@b.c', token: 't', username: 'u', bio: null, image: null };

  it('should show authenticated content when logged in', () => {
    const { fixture } = setup(mockUser);
    expect(fixture.nativeElement.querySelector('.auth-only')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.unauth-only')).toBeFalsy();
  });

  it('should show guest content when logged out', () => {
    const { fixture } = setup(null);
    expect(fixture.nativeElement.querySelector('.auth-only')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.unauth-only')).toBeTruthy();
  });

  it('should toggle views when auth state changes', () => {
    const { fixture, currentUser } = setup(null);
    currentUser.next(mockUser);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-only')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.unauth-only')).toBeFalsy();

    currentUser.next(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-only')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.unauth-only')).toBeTruthy();
  });
});
