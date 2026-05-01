import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import SettingsComponent from './settings.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../../core/auth/services/user.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { User } from '../../core/auth/user.model';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockUserService: {
    getCurrentUserSync: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

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
    mockUserService = {
      getCurrentUserSync: vi.fn().mockReturnValue(mockUser),
      update: vi.fn().mockReturnValue(of({ user: mockUser })),
      logout: vi.fn(),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [SettingsComponent, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with current user on init', () => {
    expect(component.settingsForm.value.email).toBe('test@test.com');
    expect(component.settingsForm.value.username).toBe('testuser');
    expect(component.settingsForm.value.bio).toBe('test bio');
    expect(component.settingsForm.value.image).toBe('http://example.com/avatar.png');
  });

  it('should handle null bio and image', () => {
    mockUserService.getCurrentUserSync.mockReturnValue({ ...mockUser, bio: null, image: null });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SettingsComponent, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
    });
    const fix = TestBed.createComponent(SettingsComponent);
    fix.detectChanges();
    expect(fix.componentInstance.settingsForm.value.bio).toBe('');
    expect(fix.componentInstance.settingsForm.value.image).toBe('');
  });

  it('should handle no current user on init', () => {
    mockUserService.getCurrentUserSync.mockReturnValue(null);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SettingsComponent, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
      ],
    });
    const fix = TestBed.createComponent(SettingsComponent);
    fix.detectChanges();
    expect(fix.componentInstance.settingsForm.value.email).toBe('');
  });

  it('should call userService.update on submit', () => {
    component.submitForm();
    expect(mockUserService.update).toHaveBeenCalledWith(component.settingsForm.value);
  });

  it('should navigate to profile on successful update', () => {
    component.submitForm();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile/', 'testuser']);
  });

  it('should set isSubmitting during submit', () => {
    component.submitForm();
    expect(component.isSubmitting()).toBe(true);
  });

  it('should set errors on submit failure', () => {
    const errors = { errors: { email: 'has already been taken' } };
    mockUserService.update.mockReturnValue(throwError(() => errors));
    component.submitForm();
    expect(component.errors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should call userService.logout on logout', () => {
    component.logout();
    expect(mockUserService.logout).toHaveBeenCalled();
  });
});
