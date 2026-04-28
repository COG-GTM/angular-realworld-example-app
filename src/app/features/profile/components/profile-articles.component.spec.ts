import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import ProfileArticlesComponent from './profile-articles.component';
import { ProfileService } from '../services/profile.service';
import { ArticleListComponent } from '../../article/components/article-list.component';
import { Profile } from '../models/profile.model';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ArticleListConfig } from '../../article/models/article-list-config.model';

@Component({
  selector: 'app-article-list',
  template: '<div class="mock-article-list"></div>',
  standalone: true,
})
class MockArticleListComponent {
  @Input() limit!: number;
  @Input() config!: ArticleListConfig;
  @Input() currentPage = 1;
  @Input() isFollowingFeed = false;
  @Output() pageChange = new EventEmitter<number>();
}

describe('ProfileArticlesComponent', () => {
  let component: ProfileArticlesComponent;
  let fixture: ComponentFixture<ProfileArticlesComponent>;
  let mockProfileService: { get: ReturnType<typeof vi.fn> };

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  beforeEach(() => {
    mockProfileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      imports: [ProfileArticlesComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { username: 'testuser' } },
          },
        },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).overrideComponent(ProfileArticlesComponent, {
      remove: { imports: [ArticleListComponent] },
      add: { imports: [MockArticleListComponent] },
    });

    fixture = TestBed.createComponent(ProfileArticlesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load profile and set articlesConfig', () => {
    fixture.detectChanges();
    expect(mockProfileService.get).toHaveBeenCalledWith('testuser');
    expect(component.profile()).toEqual(mockProfile);
    expect(component.articlesConfig()).toEqual({
      type: 'all',
      filters: {
        author: 'testuser',
      },
    });
  });

  it('should set config type to all', () => {
    fixture.detectChanges();
    expect(component.articlesConfig()?.type).toBe('all');
  });

  it('should set author filter to the profile username', () => {
    fixture.detectChanges();
    expect(component.articlesConfig()?.filters.author).toBe('testuser');
  });

  it('should have null config before init', () => {
    expect(component.articlesConfig()).toBeNull();
  });

  it('should work with different usernames', () => {
    mockProfileService.get.mockReturnValue(of({ ...mockProfile, username: 'anotheruser' }));
    fixture.detectChanges();
    expect(component.articlesConfig()?.filters.author).toBe('anotheruser');
  });
});
