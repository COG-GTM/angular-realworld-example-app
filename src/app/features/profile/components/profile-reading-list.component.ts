import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticlesService } from '../../article/services/articles.service';
import { Article } from '../../article/models/article.model';
import { BookmarkButtonComponent } from '../../article/components/bookmark-button.component';
import { UserService } from '../../../core/auth/services/user.service';
import { LoadingState } from '../../../core/models/loading-state.model';

@Component({
  selector: 'app-profile-reading-list',
  template: `
    @if (loading() === LoadingState.LOADING) {
      <div class="article-preview">Loading articles...</div>
    }

    @if (loading() === LoadingState.LOADED) {
      @for (article of results(); track article.slug) {
        <div class="article-preview reading-list-item">
          <div class="article-meta">
            <div class="info">
              <a class="author" [routerLink]="['/profile', article.author.username]">{{ article.author.username }}</a>
              <span class="date">· {{ article.createdAt | date: 'MMM d' }}</span>
            </div>
            <app-bookmark-button
              class="pull-xs-right"
              [article]="article"
              (toggle)="onToggleBookmark(article, $event)"
            />
          </div>
          <a [routerLink]="['/article', article.slug]" class="preview-link">
            <h1>{{ article.title }}</h1>
            <p>{{ article.description }}</p>
          </a>
        </div>
      } @empty {
        <div class="article-preview empty-reading-list-message">Nothing saved yet. Use 🔖 Save on any article.</div>
      }

      @if (totalPages().length > 1) {
        <nav>
          <ul class="pagination">
            @for (pageNumber of totalPages(); track pageNumber) {
              <li class="page-item" [ngClass]="{ active: pageNumber === page() }">
                <button class="page-link" (click)="setPageTo(pageNumber)">
                  {{ pageNumber }}
                </button>
              </li>
            }
          </ul>
        </nav>
      }
    }
  `,
  styles: `
    .page-link {
      cursor: pointer;
    }
  `,
  imports: [BookmarkButtonComponent, RouterLink, DatePipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileReadingListComponent implements OnInit {
  readonly limit = 10;
  results = signal<Article[]>([]);
  articlesCount = signal(0);
  page = signal(1);
  totalPages = signal<number[]>([]);
  loading = signal(LoadingState.NOT_LOADED);
  LoadingState = LoadingState;
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly articlesService: ArticlesService,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    const username = this.route.parent?.snapshot.params['username'];

    this.userService.authState
      .pipe(
        filter(state => state !== 'loading'),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const user = this.userService.getCurrentUserSync();
        if (!user || user.username !== username) {
          void this.router.navigate(['/profile', username], { replaceUrl: true });
          return;
        }
        this.runQuery();
      });
  }

  setPageTo(pageNumber: number): void {
    if (pageNumber !== this.page()) {
      this.page.set(pageNumber);
      this.runQuery();
    }
  }

  onToggleBookmark(article: Article, bookmarked: boolean): void {
    if (bookmarked) return;
    this.results.update(articles => articles.filter(item => item.slug !== article.slug));
    this.articlesCount.update(count => Math.max(count - 1, 0));
    this.totalPages.set(this.pageRange(this.articlesCount()));

    if (this.results().length === 0 && this.articlesCount() > 0) {
      this.page.set(Math.min(this.page(), this.totalPages().length));
      this.runQuery();
    }
  }

  private pageRange(count: number): number[] {
    return Array.from({ length: Math.ceil(count / this.limit) }, (_, index) => index + 1);
  }

  private runQuery(): void {
    this.loading.set(LoadingState.LOADING);
    this.results.set([]);

    this.articlesService
      .queryBookmarked({ limit: this.limit, offset: this.limit * (this.page() - 1) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.loading.set(LoadingState.LOADED);
        this.results.set(data.articles);
        this.articlesCount.set(data.articlesCount);
        this.totalPages.set(this.pageRange(data.articlesCount));
      });
  }
}
