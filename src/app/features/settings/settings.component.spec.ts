import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import SettingsComponent from './settings.component';
import { UserService } from '../../core/auth/services/user.service';
import { User } from '../../core/auth/user.model';

const mockUser: User = {
  email: 'me@example.com',
  token: 't',
  username: 'me',
  bio: 'my bio',
  image: 'https://example.com/me.png',
};

describe('SettingsComponent', () => {
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

  function setup(user: User | null = mockUser) {
    const userService = {
      getCurrentUserSync: vi.fn().mockReturnValue(user),
      update: vi.fn().mockReturnValue(of({ user: mockUser })),
      logout: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([]), { provide: UserService, useValue: userService }],
    });
    const fixture = TestBed.createComponent(SettingsComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, userService, router };
  }

  it('should prefill the form with the current user', () => {
    const { component } = setup();
    expect(component.settingsForm.value).toEqual(
      expect.objectContaining({
        email: 'me@example.com',
        username: 'me',
        bio: 'my bio',
        image: 'https://example.com/me.png',
      }),
    );
  });

  it('should handle missing user gracefully', () => {
    const { component } = setup(null);
    expect(component.settingsForm.value.username).toBe('');
  });

  it('should update user and navigate to profile on submit', () => {
    const { component, userService, router } = setup();
    component.submitForm();

    expect(userService.update).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/profile/', 'me']);
  });

  it('should show errors on failed update', () => {
    const { component, userService } = setup();
    const errors = { errors: { email: ['is taken'] } };
    userService.update.mockReturnValue(throwError(() => errors));

    component.submitForm();

    expect(component.errors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should delegate logout to the user service', () => {
    const { component, userService } = setup();
    component.logout();
    expect(userService.logout).toHaveBeenCalled();
  });
});
