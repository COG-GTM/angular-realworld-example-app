import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

/**
 * Toggles the favorite state of an article optimistically.
 *
 * `toggle` emits the new favorited state as soon as the button is clicked, before the
 * request completes. Requests are sent one at a time; clicks made while a request is in
 * flight update the UI immediately and are synced once it settles, so only the latest
 * intent is persisted. If a request fails, `toggle` emits the last server-confirmed state
 * so the parent can roll back.
 */
@Component({
  selector: 'app-favorite-button',
  template: `
    <button
      class="btn btn-sm"
      [ngClass]="{
        'btn-outline-primary': !article.favorited,
        'btn-primary': article.favorited,
      }"
      [attr.aria-busy]="isSubmitting()"
      (click)="toggleFavorite()"
    >
      <i class="ion-heart"></i> <ng-content></ng-content>
    </button>
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButtonComponent {
  isSubmitting = signal(false);

  @Input() article!: Article;
  @Output() toggle = new EventEmitter<boolean>();

  private confirmed = false;
  private desired = false;

  constructor(
    private readonly articleService: ArticlesService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  toggleFavorite(): void {
    this.userService.isAuthenticated.pipe(take(1)).subscribe(authenticated => {
      if (!authenticated) {
        void this.router.navigate(['/register']);
        return;
      }

      if (!this.isSubmitting()) {
        this.confirmed = this.article.favorited;
      }
      this.desired = !this.article.favorited;
      this.toggle.emit(this.desired);

      if (!this.isSubmitting()) {
        this.sync(this.article.slug);
      }
    });
  }

  private sync(slug: string): void {
    const target = this.desired;
    if (target === this.confirmed) {
      this.isSubmitting.set(false);
      return;
    }

    this.isSubmitting.set(true);
    const request$: Observable<unknown> = target
      ? this.articleService.favorite(slug)
      : this.articleService.unfavorite(slug);
    request$.subscribe({
      complete: () => {
        this.confirmed = target;
        if (this.desired !== target) {
          this.sync(slug);
        } else {
          this.isSubmitting.set(false);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        if (this.desired !== this.confirmed) {
          this.desired = this.confirmed;
          this.toggle.emit(this.confirmed);
        }
      },
    });
  }
}
