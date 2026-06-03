import { initTestBed } from '../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import SettingsComponent from './settings.component';
import { UserService } from '../../core/auth/services/user.service';
import { User } from '../../core/auth/user.model';

const user: User = {
  email: 'jane@example.com',
  token: 't',
  username: 'jane',
  bio: 'hi',
  image: 'https://img/jane.png',
};

describe('SettingsComponent', () => {
  let userService: {
    getCurrentUserSync: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let component: SettingsComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    userService = { getCurrentUserSync: vi.fn().mockReturnValue(user), update: vi.fn(), logout: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        SettingsComponent,
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });
    component = TestBed.inject(SettingsComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch the form from the current user on init', () => {
    component.ngOnInit();
    expect(component.settingsForm.value.username).toBe('jane');
    expect(component.settingsForm.value.image).toBe('https://img/jane.png');
  });

  it('should handle a null bio/image gracefully on init', () => {
    userService.getCurrentUserSync.mockReturnValue({ ...user, bio: null, image: null });
    component.ngOnInit();
    expect(component.settingsForm.value.bio).toBe('');
    expect(component.settingsForm.value.image).toBe('');
  });

  it('should not patch the form when there is no current user', () => {
    userService.getCurrentUserSync.mockReturnValue(null);
    component.ngOnInit();
    expect(component.settingsForm.value.username).toBe('');
  });

  it('should delegate logout to the user service', () => {
    component.logout();
    expect(userService.logout).toHaveBeenCalled();
  });

  it('should navigate to the profile on successful update', () => {
    userService.update.mockReturnValue(of({ user }));
    component.submitForm();
    expect(userService.update).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/profile/', 'jane']);
  });

  it('should surface errors and reset submitting on update failure', () => {
    userService.update.mockReturnValue(throwError(() => ({ errors: { email: ['taken'] } })));
    component.submitForm();
    expect(component.errors()).toEqual({ errors: { email: ['taken'] } });
    expect(component.isSubmitting()).toBe(false);
  });
});
