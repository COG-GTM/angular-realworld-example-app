import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import EditorComponent from './editor.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { of, throwError } from 'rxjs';
import { Article } from '../../models/article.model';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let mockArticlesService: Record<string, ReturnType<typeof vi.fn>>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Title',
    description: 'Test Desc',
    body: 'Test Body',
    tagList: ['tag1', 'tag2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'testuser', bio: null, image: null, following: false },
  };

  const mockUser = {
    email: 'test@test.com',
    token: 'token',
    username: 'testuser',
    bio: null,
    image: null,
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  function createComponent(slug: string | null = null) {
    mockArticlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      create: vi.fn().mockReturnValue(of(mockArticle)),
      update: vi.fn().mockReturnValue(of(mockArticle)),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EditorComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: mockArticlesService },
        { provide: Router, useValue: mockRouter },
        {
          provide: UserService,
          useValue: {
            getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: slug ? { slug } : {} },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('new article', () => {
    beforeEach(() => createComponent());

    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty form', () => {
      expect(component.articleForm.value).toEqual({
        title: '',
        description: '',
        body: '',
      });
    });

    it('should have empty tag list', () => {
      expect(component.tagList()).toEqual([]);
    });

    it('should add a tag', () => {
      component.tagField.setValue('newtag');
      component.addTag();
      expect(component.tagList()).toEqual(['newtag']);
      expect(component.tagField.value).toBe('');
    });

    it('should not add duplicate tag', () => {
      component.tagField.setValue('tag1');
      component.addTag();
      component.tagField.setValue('tag1');
      component.addTag();
      expect(component.tagList()).toEqual(['tag1']);
    });

    it('should not add empty tag', () => {
      component.tagField.setValue('');
      component.addTag();
      expect(component.tagList()).toEqual([]);
    });

    it('should not add whitespace-only tag', () => {
      component.tagField.setValue('   ');
      component.addTag();
      expect(component.tagList()).toEqual([]);
    });

    it('should remove a tag', () => {
      component.tagField.setValue('tag1');
      component.addTag();
      component.tagField.setValue('tag2');
      component.addTag();
      component.removeTag('tag1');
      expect(component.tagList()).toEqual(['tag2']);
    });

    it('should call create on submit', () => {
      component.articleForm.setValue({ title: 'Title', description: 'Desc', body: 'Body' });
      component.tagField.setValue('tag1');
      component.submitForm();
      expect(mockArticlesService['create']).toHaveBeenCalledWith({
        title: 'Title',
        description: 'Desc',
        body: 'Body',
        tagList: ['tag1'],
      });
    });

    it('should navigate to article on successful create', () => {
      component.articleForm.setValue({ title: 'Title', description: 'Desc', body: 'Body' });
      component.submitForm();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/article/', 'test-article']);
    });

    it('should set errors on submit failure', () => {
      const errors = { errors: { title: "can't be blank" } };
      mockArticlesService['create'] = vi.fn().mockReturnValue(throwError(() => errors));
      component.articleForm.setValue({ title: '', description: '', body: '' });
      component.submitForm();
      expect(component.errors()).toEqual(errors);
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('editing existing article', () => {
    beforeEach(() => createComponent('test-article'));

    it('should load article data into form', () => {
      expect(component.articleForm.value.title).toBe('Test Title');
      expect(component.articleForm.value.description).toBe('Test Desc');
      expect(component.articleForm.value.body).toBe('Test Body');
    });

    it('should load tags', () => {
      expect(component.tagList()).toEqual(['tag1', 'tag2']);
    });

    it('should call update on submit', () => {
      component.submitForm();
      expect(mockArticlesService['update']).toHaveBeenCalled();
      const call = mockArticlesService['update'].mock.calls[0][0];
      expect(call.slug).toBe('test-article');
    });
  });

  describe('editing article by different author', () => {
    it('should redirect when user is not the author', () => {
      const diffArticle = { ...mockArticle, author: { ...mockArticle.author, username: 'otheruser' } };
      const diffService = {
        get: vi.fn().mockReturnValue(of(diffArticle)),
        create: vi.fn(),
        update: vi.fn(),
      };

      TestBed.configureTestingModule({
        imports: [EditorComponent, RouterTestingModule],
        providers: [
          { provide: ArticlesService, useValue: diffService },
          { provide: Router, useValue: { navigate: vi.fn() } },
          {
            provide: UserService,
            useValue: {
              getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })),
            },
          },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { params: { slug: 'test-article' } },
            },
          },
        ],
      });

      const fix = TestBed.createComponent(EditorComponent);
      fix.detectChanges();
      const router = TestBed.inject(Router);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
