import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticlesService } from '../../article/services/articles.service';
import { Article } from '../../article/models/article.model';
import { ArticleMetaComponent } from '../../article/components/article-meta.component';
import { BookmarkButtonComponent } from '../../article/components/bookmark-button.component';
import { LoadingState } from '../../../core/models/loading-state.model';

@Component({
  selector: 'app-profile-reading-list',
  template: `
    @if (loading() === LoadingState.LOADING) {
      <div class="article-preview">Loading reading list...</div>
    }

    @if (loadError()) {
      <div class="article-preview reading-list-error" role="alert">
        Could not load your reading list.
        <button type="button" class="btn btn-sm btn-outline-secondary" (click)="load()">Retry</button>
      </div>
    }

    @if (loading() === LoadingState.LOADED) {
      @for (article of results(); track article.slug) {
        <div class="article-preview">
          <app-article-meta [article]="article">
            <app-bookmark-button class="pull-xs-right" [article]="article" (toggle)="onToggle($event)" />
          </app-article-meta>
          <a [routerLink]="['/article', article.slug]" class="preview-link">
            <h1>{{ article.title }}</h1>
            <p>{{ article.description }}</p>
            <span>Read more...</span>
          </a>
        </div>
      } @empty {
        <div class="article-preview empty-reading-list">Nothing saved yet. Use 🔖 Save on any article.</div>
      }

      @if (totalPages().length > 1) {
        <nav>
          <ul class="pagination">
            @for (pageNumber of totalPages(); track pageNumber) {
              <li class="page-item" [ngClass]="{ active: pageNumber === page() }">
                <button class="page-link" (click)="setPageTo(pageNumber)">{{ pageNumber }}</button>
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
  imports: [ArticleMetaComponent, BookmarkButtonComponent, RouterLink, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileReadingListComponent implements OnInit {
  readonly limit = 10;
  results = signal<Article[]>([]);
  articlesCount = signal(0);
  page = signal(1);
  totalPages = signal<number[]>([]);
  loading = signal(LoadingState.NOT_LOADED);
  loadError = signal(false);
  LoadingState = LoadingState;
  destroyRef = inject(DestroyRef);

  constructor(private readonly articlesService: ArticlesService) {}

  ngOnInit(): void {
    this.load();
  }

  setPageTo(pageNumber: number): void {
    if (pageNumber !== this.page()) {
      this.page.set(pageNumber);
      this.load();
    }
  }

  load(background = false): void {
    if (!background) {
      this.loading.set(LoadingState.LOADING);
      this.results.set([]);
    }
    this.loadError.set(false);

    this.articlesService
      .queryBookmarked(this.limit, this.limit * (this.page() - 1))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.results.set(data.articles);
          this.setCount(data.articlesCount);
          this.loading.set(LoadingState.LOADED);
          if (data.articles.length === 0 && this.page() > 1 && this.totalPages().length < this.page()) {
            this.page.set(this.totalPages().length || 1);
            this.load();
          }
        },
        error: () => {
          this.loading.set(LoadingState.NOT_LOADED);
          this.loadError.set(true);
        },
      });
  }

  onToggle(article: Article): void {
    if (article.bookmarked) {
      this.results.update(list =>
        list.map(item => (item.slug === article.slug ? { ...item, bookmarked: true } : item)),
      );
      return;
    }

    this.results.update(list => list.filter(item => item.slug !== article.slug));
    this.setCount(Math.max(this.articlesCount() - 1, 0));

    const shownBefore = this.limit * (this.page() - 1);
    if (this.results().length === 0 && this.page() > 1) {
      this.page.set(this.page() - 1);
      this.load();
    } else if (this.articlesCount() > shownBefore + this.results().length) {
      this.load(true);
    }
  }

  private setCount(count: number): void {
    this.articlesCount.set(count);
    this.totalPages.set(Array.from({ length: Math.ceil(count / this.limit) }, (_, index) => index + 1));
  }
}
