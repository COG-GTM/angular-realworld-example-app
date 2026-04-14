import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IfAuthenticatedDirective } from './if-authenticated.directive';
import { UserService } from './services/user.service';

@Component({
  template: `
    <div *ifAuthenticated="true" class="auth-content">Authenticated Content</div>
    <div *ifAuthenticated="false" class="unauth-content">Unauthenticated Content</div>
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

  it('should show unauthenticated content when user is not authenticated', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.unauth-content')).toBeTruthy();
    expect(el.querySelector('.auth-content')).toBeFalsy();
  });

  it('should show authenticated content when user is authenticated', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.auth-content')).toBeTruthy();
    expect(el.querySelector('.unauth-content')).toBeFalsy();
  });

  it('should toggle content when auth state changes', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    let el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.unauth-content')).toBeTruthy();
    expect(el.querySelector('.auth-content')).toBeFalsy();

    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.auth-content')).toBeTruthy();
    expect(el.querySelector('.unauth-content')).toBeFalsy();
  });

  it('should toggle back from authenticated to unauthenticated', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    let el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.auth-content')).toBeTruthy();

    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.unauth-content')).toBeTruthy();
    expect(el.querySelector('.auth-content')).toBeFalsy();
  });
});
