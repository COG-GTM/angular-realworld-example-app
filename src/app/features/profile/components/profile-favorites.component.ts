import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleListComponent } from '../../article/components/article-list.component';
import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';
import { ArticleListConfig } from '../../article/models/article-list-config.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-profile-favorites',
  template: `@if (favoritesConfig()) {
    <app-article-list [limit]="10" [config]="favoritesConfig()!" />
  }`,
  imports: [ArticleListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfileFavoritesComponent implements OnInit {
  profile = signal<Profile | null>(null);
  favoritesConfig = signal<ArticleListConfig | null>(null);
  destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private readonly profileService: ProfileService,
  ) {}

  ngOnInit() {
    this.route
      .parent!.paramMap.pipe(
        switchMap(params => this.profileService.get(params.get('username')!)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile: Profile) => {
          this.profile.set(profile);
          this.favoritesConfig.set({
            type: 'all',
            filters: {
              favorited: profile.username,
            },
          });
        },
      });
  }
}
