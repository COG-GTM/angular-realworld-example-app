import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleListComponent } from '../../article/components/article-list.component';
import { ArticleListConfig } from '../../article/models/article-list-config.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-favorites',
  template: `@if (favoritesConfig()) {
    <app-article-list [limit]="10" [config]="favoritesConfig()!" />
  }`,
  imports: [ArticleListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileFavoritesComponent implements OnInit {
  favoritesConfig = signal<ArticleListConfig | null>(null);
  destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.parent!.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.favoritesConfig.set({
        type: 'all',
        filters: {
          favorited: params.get('username')!,
        },
      });
    });
  }
}
