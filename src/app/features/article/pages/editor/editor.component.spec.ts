import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import EditorComponent from './editor.component';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { User } from '../../../../core/auth/user.model';

describe('EditorComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let articlesService: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    tagList: ['test', 'angular'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    favorited: false,
    favoritesCount: 5,
    author: { username: 'testuser', bio: 'Bio', image: 'https://example.com/avatar.jpg', following: false },
  };

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Bio',
    image: 'https://example.com/avatar.jpg',
  };

  function createComponent(slug?: string) {
    articlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      create: vi.fn().mockReturnValue(of(mockArticle)),
      update: vi.fn().mockReturnValue(of(mockArticle)),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: slug ? { slug } : {} } },
        },
        { provide: ArticlesService, useValue: articlesService },
        { provide: Router, useValue: router },
        {
          provide: UserService,
          useValue: { getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })) },
        },
      ],
    });

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('new article mode', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have empty form fields', () => {
      expect(component.articleForm.value.title).toBe('');
      expect(component.articleForm.value.description).toBe('');
      expect(component.articleForm.value.body).toBe('');
    });

    it('should have empty tag list', () => {
      expect(component.tagList()).toEqual([]);
    });

    it('should not fetch article', () => {
      expect(articlesService.get).not.toHaveBeenCalled();
    });

    it('should call create on submit', () => {
      component.articleForm.patchValue({ title: 'New', description: 'Desc', body: 'Body' });
      component.submitForm();
      expect(articlesService.create).toHaveBeenCalled();
    });

    it('should navigate to article after create', () => {
      component.articleForm.patchValue({ title: 'New', description: 'Desc', body: 'Body' });
      component.submitForm();
      expect(router.navigate).toHaveBeenCalledWith(['/article/', 'test-article']);
    });

    it('should set isSubmitting on submit', () => {
      component.submitForm();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should set errors on create failure', () => {
      const errorResponse = { errors: { title: "can't be blank" } };
      articlesService.create.mockReturnValue(throwError(() => errorResponse));
      component.submitForm();
      expect(component.errors()).toEqual(errorResponse);
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('edit article mode', () => {
    beforeEach(() => {
      createComponent('test-article');
    });

    it('should fetch the article', () => {
      expect(articlesService.get).toHaveBeenCalledWith('test-article');
    });

    it('should populate form with article data', () => {
      expect(component.articleForm.value.title).toBe('Test Article');
      expect(component.articleForm.value.description).toBe('Test description');
      expect(component.articleForm.value.body).toBe('Test body');
    });

    it('should populate tag list', () => {
      expect(component.tagList()).toEqual(['test', 'angular']);
    });

    it('should call update on submit', () => {
      component.submitForm();
      expect(articlesService.update).toHaveBeenCalled();
    });

    it('should redirect if user is not the author', () => {
      TestBed.resetTestingModule();
      const otherArticle = { ...mockArticle, author: { ...mockArticle.author, username: 'other' } };
      articlesService = {
        get: vi.fn().mockReturnValue(of(otherArticle)),
        create: vi.fn(),
        update: vi.fn(),
      };
      router = { navigate: vi.fn() };

      TestBed.configureTestingModule({
        imports: [EditorComponent],
        providers: [
          { provide: ActivatedRoute, useValue: { snapshot: { params: { slug: 'test-article' } } } },
          { provide: ArticlesService, useValue: articlesService },
          { provide: Router, useValue: router },
          { provide: UserService, useValue: { getCurrentUser: vi.fn().mockReturnValue(of({ user: mockUser })) } },
        ],
      });

      const f = TestBed.createComponent(EditorComponent);
      f.detectChanges();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('tag management', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should add a tag', () => {
      component.tagField.setValue('newtag');
      component.addTag();
      expect(component.tagList()).toContain('newtag');
    });

    it('should not add duplicate tags', () => {
      component.tagField.setValue('angular');
      component.addTag();
      component.tagField.setValue('angular');
      component.addTag();
      expect(component.tagList().filter(t => t === 'angular').length).toBe(1);
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

    it('should clear tag field after adding', () => {
      component.tagField.setValue('newtag');
      component.addTag();
      expect(component.tagField.value).toBe('');
    });

    it('should remove a tag', () => {
      component.tagField.setValue('tag1');
      component.addTag();
      component.tagField.setValue('tag2');
      component.addTag();
      component.removeTag('tag1');
      expect(component.tagList()).toEqual(['tag2']);
    });

    it('should include tags in submit', () => {
      component.tagField.setValue('newtag');
      component.addTag();
      component.submitForm();
      const callArg = articlesService.create.mock.calls[0][0];
      expect(callArg.tagList).toContain('newtag');
    });

    it('should add pending tag field on submit', () => {
      component.tagField.setValue('pending');
      component.submitForm();
      const callArg = articlesService.create.mock.calls[0][0];
      expect(callArg.tagList).toContain('pending');
    });
  });
});
