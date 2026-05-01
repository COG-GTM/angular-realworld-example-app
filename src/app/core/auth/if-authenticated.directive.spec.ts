import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Component } from '@angular/core';
import { IfAuthenticatedDirective } from './if-authenticated.directive';
import { UserService } from './services/user.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  template: `
    <div *ifAuthenticated="true" class="auth-content">Authenticated content</div>
    <div *ifAuthenticated="false" class="unauth-content">Unauthenticated content</div>
  `,
  imports: [IfAuthenticatedDirective],
})
class TestHostComponent {}

describe('IfAuthenticatedDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthenticatedSubject.asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(TestHostComponent);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should show unauthenticated content when not logged in', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    const authEl = fixture.nativeElement.querySelector('.auth-content');
    const unauthEl = fixture.nativeElement.querySelector('.unauth-content');
    expect(authEl).toBeNull();
    expect(unauthEl).toBeTruthy();
  });

  it('should show authenticated content when logged in', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    const authEl = fixture.nativeElement.querySelector('.auth-content');
    const unauthEl = fixture.nativeElement.querySelector('.unauth-content');
    expect(authEl).toBeTruthy();
    expect(unauthEl).toBeNull();
  });

  it('should toggle content when auth state changes', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-content')).toBeNull();
    expect(fixture.nativeElement.querySelector('.unauth-content')).toBeTruthy();

    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.unauth-content')).toBeNull();
  });

  it('should toggle back when user logs out', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-content')).toBeTruthy();

    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.auth-content')).toBeNull();
    expect(fixture.nativeElement.querySelector('.unauth-content')).toBeTruthy();
  });
});
