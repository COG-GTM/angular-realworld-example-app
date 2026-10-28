import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, filter, switchMap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

@Component({
  selector: 'app-bookmark-button',
  template: `
    <button
      type="button"
      class="btn btn-sm btn-bookmark"
      [class.btn-bookmark-active]="article.bookmarked"
      [class.disabled]="isSubmitting()"
      [disabled]="isSubmitting()"
      [attr.aria-pressed]="article.bookmarked"
      [attr.aria-busy]="isSubmitting()"
      (click)="toggleBookmark()"
    >
      🔖 {{ article.bookmarked ? 'Saved' : 'Save' }}
    </button>
    @if (error()) {
      <span class="bookmark-error" role="alert">{{ error() }}</span>
    }
  `,
  styles: `
    .btn-bookmark {
      color: #f0ad4e;
      background-color: transparent;
      border-color: #f0ad4e;
    }
    .btn-bookmark:hover,
    .btn-bookmark-active {
      color: #fff;
      background-color: #f0ad4e;
      border-color: #eb9316;
    }
    .bookmark-error {
      margin-left: 0.25rem;
      color: #b85c5c;
      font-size: 0.8rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookmarkButtonComponent {
  destroyRef = inject(DestroyRef);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  @Input({ required: true }) article!: Article;
  @Output() toggle = new EventEmitter<Article>();

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  toggleBookmark(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.error.set(null);

    this.userService.authState
      .pipe(
        filter(state => state !== 'loading'),
        take(1),
        switchMap(state => {
          if (state === 'unauthenticated') {
            this.isSubmitting.set(false);
            void this.router.navigate(['/login']);
            return EMPTY;
          }
          if (state === 'unavailable') {
            this.isSubmitting.set(false);
            this.error.set('Could not reach the server. Try again.');
            return EMPTY;
          }
          return this.article.bookmarked
            ? this.articlesService.unbookmark(this.article.slug)
            : this.articlesService.bookmark(this.article.slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: article => {
          this.isSubmitting.set(false);
          this.toggle.emit(article);
        },
        error: (err: { status?: number }) => {
          this.isSubmitting.set(false);
          if (err?.status === 401) {
            void this.router.navigate(['/login']);
            return;
          }
          this.error.set('Could not update reading list. Try again.');
        },
      });
  }
}
