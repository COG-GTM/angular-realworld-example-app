import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import SettingsComponent from './settings.component';
import { UserService } from '../../core/auth/services/user.service';
import { User } from '../../core/auth/user.model';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let userService: any;
  let router: any;

  const mockUser: User = {
    email: 'test@test.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    userService = {
      getCurrentUserSync: vi.fn().mockReturnValue(mockUser),
      update: vi.fn().mockReturnValue(of({ user: mockUser })),
      logout: vi.fn(),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with current user data on init', () => {
    component.ngOnInit();
    expect(component.settingsForm.get('email')?.value).toBe('test@test.com');
    expect(component.settingsForm.get('username')?.value).toBe('testuser');
    expect(component.settingsForm.get('bio')?.value).toBe('Test bio');
    expect(component.settingsForm.get('image')?.value).toBe('https://example.com/avatar.jpg');
  });

  it('should handle null bio and image', () => {
    userService.getCurrentUserSync.mockReturnValue({ ...mockUser, bio: null, image: null });
    component.ngOnInit();
    expect(component.settingsForm.get('bio')?.value).toBe('');
    expect(component.settingsForm.get('image')?.value).toBe('');
  });

  it('should handle null user on init', () => {
    userService.getCurrentUserSync.mockReturnValue(null);
    component.ngOnInit();
    expect(component.settingsForm.get('email')?.value).toBe('');
  });

  it('should start with isSubmitting as false', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should start with null errors', () => {
    expect(component.errors()).toBeNull();
  });

  it('should call logout on logout', () => {
    component.logout();
    expect(userService.logout).toHaveBeenCalled();
  });

  it('should submit form and navigate to profile', () => {
    component.ngOnInit();
    component.submitForm();
    expect(userService.update).toHaveBeenCalledWith(component.settingsForm.value);
    expect(router.navigate).toHaveBeenCalledWith(['/profile/', 'testuser']);
  });

  it('should set isSubmitting to true on submit', () => {
    component.submitForm();
    expect(component.isSubmitting()).toBe(true);
  });

  it('should set errors on submit failure', () => {
    const errorResponse = { errors: { email: 'is already taken' } };
    userService.update.mockReturnValue(throwError(() => errorResponse));
    component.submitForm();
    expect(component.errors()).toEqual(errorResponse);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have password field with required validator', () => {
    const passwordControl = component.settingsForm.get('password');
    expect(passwordControl).toBeTruthy();
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBe(false);
    passwordControl?.setValue('password123');
    expect(passwordControl?.valid).toBe(true);
  });
});
