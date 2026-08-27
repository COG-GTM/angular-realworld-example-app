import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import EditorComponent from './editor.component';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';

const mockArticle: Article = {
  slug: 'existing-article',
  title: 'Existing',
  description: 'desc',
  body: 'body',
  tagList: ['tag1'],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'me', bio: '', image: '', following: false },
};

describe('EditorComponent', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setup(slug?: string, username = 'me') {
    const articlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      create: vi.fn().mockReturnValue(of({ ...mockArticle, slug: 'new-article' })),
      update: vi.fn().mockReturnValue(of(mockArticle)),
    };
    const userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({ user: { username } })),
    };
    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: userService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: slug ? { slug } : {} } } },
      ],
    });
    const fixture = TestBed.createComponent(EditorComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, articlesService, router };
  }

  it('should start with an empty form for a new article', () => {
    const { component, articlesService } = setup();
    expect(component.articleForm.value.title).toBe('');
    expect(articlesService.get).not.toHaveBeenCalled();
  });

  it('should load an existing article for its author', () => {
    const { component } = setup('existing-article');
    expect(component.articleForm.value.title).toBe('Existing');
    expect(component.tagList()).toEqual(['tag1']);
  });

  it('should redirect non-authors to home', () => {
    const { router } = setup('existing-article', 'someone-else');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should add and remove tags', () => {
    const { component } = setup();
    component.tagField.setValue('newtag');
    component.addTag();
    expect(component.tagList()).toEqual(['newtag']);
    expect(component.tagField.value).toBe('');

    component.tagField.setValue('newtag');
    component.addTag();
    expect(component.tagList()).toEqual(['newtag']);

    component.tagField.setValue('   ');
    component.addTag();
    expect(component.tagList()).toEqual(['newtag']);

    component.removeTag('newtag');
    expect(component.tagList()).toEqual([]);
  });

  it('should create a new article and navigate to it', () => {
    const { component, articlesService, router } = setup();
    component.articleForm.patchValue({ title: 'New', description: 'd', body: 'b' });
    component.submitForm();

    expect(articlesService.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'New' }));
    expect(router.navigate).toHaveBeenCalledWith(['/article/', 'new-article']);
  });

  it('should update an existing article on submit', () => {
    const { component, articlesService } = setup('existing-article');
    component.submitForm();

    expect(articlesService.update).toHaveBeenCalledWith(expect.objectContaining({ slug: 'existing-article' }));
  });

  it('should show errors on failed submit', () => {
    const { component, articlesService } = setup();
    const errors = { errors: { title: ["can't be blank"] } };
    articlesService.create.mockReturnValue(throwError(() => errors));

    component.submitForm();

    expect(component.errors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });
});
