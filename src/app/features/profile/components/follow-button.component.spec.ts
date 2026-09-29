import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { FollowButtonComponent } from './follow-button.component';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';

describe('FollowButtonComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const profile: Profile = { username: 'jane', bio: 'bio', image: '', following: false };

  let follow$: Subject<Profile>;
  let unfollow$: Subject<Profile>;
  let isAuthenticated: BehaviorSubject<boolean>;
  let profileService: { follow: ReturnType<typeof vi.fn>; unfollow: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function create(input: Profile) {
    const fixture = TestBed.createComponent(FollowButtonComponent);
    fixture.componentRef.setInput('profile', input);
    const emitted: Profile[] = [];
    fixture.componentInstance.toggle.subscribe(value => {
      emitted.push(value);
      fixture.componentRef.setInput('profile', value);
    });
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, emitted };
  }

  beforeEach(() => {
    follow$ = new Subject<Profile>();
    unfollow$ = new Subject<Profile>();
    isAuthenticated = new BehaviorSubject(true);
    profileService = {
      follow: vi.fn(() => follow$),
      unfollow: vi.fn(() => unfollow$),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      imports: [FollowButtonComponent],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: UserService, useValue: { isAuthenticated } },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits the followed profile immediately, before the request completes', () => {
    const { component, emitted } = create(profile);

    component.toggleFollowing();

    expect(profileService.follow).toHaveBeenCalledWith('jane');
    expect(emitted).toEqual([{ ...profile, following: true }]);
    expect(component.isSubmitting()).toBe(true);
  });

  it('reconciles with the server profile on success', () => {
    const { component, emitted } = create(profile);
    const serverProfile = { ...profile, bio: 'updated bio', following: true };

    component.toggleFollowing();
    follow$.next(serverProfile);
    follow$.complete();

    expect(emitted).toEqual([{ ...profile, following: true }, serverProfile]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('rolls back to the original profile when following fails', () => {
    const { component, emitted } = create(profile);

    component.toggleFollowing();
    follow$.error({ status: 500 });

    expect(emitted).toEqual([{ ...profile, following: true }, profile]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('emits unfollowed immediately and rolls back when unfollowing fails', () => {
    const followed = { ...profile, following: true };
    const { component, emitted } = create(followed);

    component.toggleFollowing();
    expect(profileService.unfollow).toHaveBeenCalledWith('jane');
    expect(emitted).toEqual([{ ...profile, following: false }]);

    unfollow$.error({ status: 500 });
    expect(emitted).toEqual([{ ...profile, following: false }, followed]);
  });

  it('updates immediately on rapid clicks and only syncs the latest intent', () => {
    const { component, emitted } = create(profile);

    component.toggleFollowing();
    component.toggleFollowing();

    expect(emitted.map(p => p.following)).toEqual([true, false]);
    expect(profileService.follow).toHaveBeenCalledTimes(1);
    expect(profileService.unfollow).not.toHaveBeenCalled();

    follow$.next({ ...profile, following: true });
    follow$.complete();
    expect(profileService.unfollow).toHaveBeenCalledWith('jane');
    expect(component.isSubmitting()).toBe(true);

    unfollow$.next({ ...profile, following: false });
    unfollow$.complete();
    expect(emitted.map(p => p.following)).toEqual([true, false, false]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not send a follow-up request when rapid clicks end on the in-flight state', () => {
    const { component, emitted } = create(profile);

    component.toggleFollowing();
    component.toggleFollowing();
    component.toggleFollowing();
    follow$.next({ ...profile, following: true });
    follow$.complete();

    expect(emitted.map(p => p.following)).toEqual([true, false, true, true]);
    expect(profileService.follow).toHaveBeenCalledTimes(1);
    expect(profileService.unfollow).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('rolls back to the last confirmed profile when a follow-up request fails', () => {
    const { component, emitted } = create(profile);
    const followed = { ...profile, following: true };

    component.toggleFollowing();
    component.toggleFollowing();
    follow$.next(followed);
    follow$.complete();
    unfollow$.error({ status: 500 });

    expect(emitted.map(p => p.following)).toEqual([true, false, true]);
    expect(emitted[emitted.length - 1]).toEqual(followed);
    expect(component.isSubmitting()).toBe(false);
  });

  it('updates the button label immediately and restores it on failure', () => {
    const { fixture } = create(profile);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Follow jane');

    button.click();
    fixture.detectChanges();
    expect(button.textContent).toContain('Unfollow jane');
    expect(button.classList).toContain('btn-secondary');

    follow$.error({ status: 500 });
    fixture.detectChanges();
    expect(button.textContent).not.toContain('Unfollow');
    expect(button.textContent).toContain('Follow jane');
    expect(button.classList).toContain('btn-outline-secondary');
  });

  it('redirects unauthenticated users without emitting or calling the API', () => {
    isAuthenticated.next(false);
    const { component, emitted } = create(profile);

    component.toggleFollowing();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(profileService.follow).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
    expect(component.isSubmitting()).toBe(false);
  });
});
