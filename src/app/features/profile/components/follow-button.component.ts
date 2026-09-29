import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';
import { NgClass } from '@angular/common';

/**
 * Toggles following a profile optimistically.
 *
 * `toggle` emits the optimistically updated profile as soon as the button is clicked.
 * Requests are sent one at a time; clicks made while a request is in flight update the UI
 * immediately and are synced once it settles, so only the latest intent is persisted.
 * When all requests settle, `toggle` emits the server's profile. If a request fails,
 * `toggle` emits the last server-confirmed profile so the parent can roll back.
 */
@Component({
  selector: 'app-follow-button',
  template: `
    <button
      class="btn btn-sm action-btn"
      [ngClass]="{
        'btn-outline-secondary': !profile.following,
        'btn-secondary': profile.following,
      }"
      [attr.aria-busy]="isSubmitting()"
      (click)="toggleFollowing()"
    >
      <i class="ion-plus-round"></i>
      &nbsp;
      {{ profile.following ? 'Unfollow' : 'Follow' }} {{ profile.username }}
    </button>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowButtonComponent {
  @Input() profile!: Profile;
  @Output() toggle = new EventEmitter<Profile>();
  isSubmitting = signal(false);

  private confirmed!: Profile;
  private desired = false;

  constructor(
    private readonly profileService: ProfileService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  toggleFollowing(): void {
    this.userService.isAuthenticated.pipe(take(1)).subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        void this.router.navigate(['/login']);
        return;
      }

      if (!this.isSubmitting()) {
        this.confirmed = this.profile;
      }
      this.desired = !this.profile.following;
      this.toggle.emit({ ...this.profile, following: this.desired });

      if (!this.isSubmitting()) {
        this.sync();
      }
    });
  }

  private sync(): void {
    const target = this.desired;
    const { username, following } = this.confirmed;
    if (target === following) {
      this.isSubmitting.set(false);
      this.toggle.emit(this.confirmed);
      return;
    }

    this.isSubmitting.set(true);
    const request$ = target ? this.profileService.follow(username) : this.profileService.unfollow(username);
    request$.subscribe({
      next: profile => {
        this.confirmed = profile;
      },
      complete: () => {
        if (this.desired !== target) {
          this.sync();
        } else {
          this.isSubmitting.set(false);
          this.toggle.emit(this.confirmed);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.desired = this.confirmed.following;
        this.toggle.emit(this.confirmed);
      },
    });
  }
}
