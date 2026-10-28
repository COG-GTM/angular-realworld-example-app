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
import { EMPTY, switchMap, take } from 'rxjs';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bookmark-button',
  template: `
    <button
      type="button"
      class="btn btn-sm bookmark-btn"
      [ngClass]="{
        disabled: isSubmitting(),
        'btn-outline-bookmark': !article.bookmarked,
        'btn-bookmark': article.bookmarked,
      }"
      [attr.aria-pressed]="!!article.bookmarked"
      (click)="toggleBookmark()"
    >
      🔖 {{ article.bookmarked ? 'Saved' : 'Save' }}
    </button>
  `,
  styles: `
    .btn-outline-bookmark {
      color: #f0ad4e;
      background-color: transparent;
      border-color: #f0ad4e;
    }
    .btn-outline-bookmark:hover {
      color: #fff;
      background-color: #f0ad4e;
      border-color: #f0ad4e;
    }
    .btn-bookmark {
      color: #fff;
      background-color: #f0ad4e;
      border-color: #f0ad4e;
    }
    .btn-bookmark:hover,
    .btn-bookmark:focus {
      color: #fff;
      background-color: #ec971f;
      border-color: #eb9316;
    }
  `,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookmarkButtonComponent {
  destroyRef = inject(DestroyRef);
  isSubmitting = signal(false);

  @Input() article!: Article;
  @Output() toggle = new EventEmitter<boolean>();

  constructor(
    private readonly articleService: ArticlesService,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  toggleBookmark(): void {
    const wasBookmarked = !!this.article.bookmarked;
    this.isSubmitting.set(true);

    this.userService.isAuthenticated
      .pipe(
        take(1),
        switchMap(authenticated => {
          if (!authenticated) {
            this.isSubmitting.set(false);
            void this.router.navigate(['/login']);
            return EMPTY;
          }

          return wasBookmarked
            ? this.articleService.unbookmark(this.article.slug)
            : this.articleService.bookmark(this.article.slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toggle.emit(!wasBookmarked);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }
}
