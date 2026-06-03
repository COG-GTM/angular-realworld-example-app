import { initTestBed } from '../../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import EditorComponent from './editor.component';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';

const article: Article = {
  slug: 'my-slug',
  title: 'T',
  description: 'D',
  body: 'B',
  tagList: ['ng'],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'jane', bio: null, image: null, following: false },
};

function configure(slug?: string) {
  const articleService = { get: vi.fn(), create: vi.fn(), update: vi.fn() };
  const userService = { getCurrentUser: vi.fn() };
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      EditorComponent,
      { provide: ArticlesService, useValue: articleService },
      { provide: UserService, useValue: userService },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { params: slug ? { slug } : {} } } },
    ],
  });
  const component = TestBed.inject(EditorComponent);
  return { component, articleService, userService, router };
}

describe('EditorComponent', () => {
  beforeAll(() => {
    initTestBed();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(configure().component).toBeTruthy();
  });

  it('should load and patch an existing article for its author', () => {
    const { component, articleService, userService } = configure('my-slug');
    articleService.get.mockReturnValue(of(article));
    userService.getCurrentUser.mockReturnValue(of({ user: { username: 'jane' } }));
    component.ngOnInit();
    expect(component.tagList()).toEqual(['ng']);
    expect(component.articleForm.value.title).toBe('T');
  });

  it('should redirect away when editing an article that is not yours', () => {
    const { component, articleService, userService, router } = configure('my-slug');
    articleService.get.mockReturnValue(of(article));
    userService.getCurrentUser.mockReturnValue(of({ user: { username: 'bob' } }));
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not fetch anything on init when there is no slug', () => {
    const { component, articleService } = configure();
    component.ngOnInit();
    expect(articleService.get).not.toHaveBeenCalled();
  });

  it('should add a non-empty, unique tag and clear the field', () => {
    const { component } = configure();
    component.tagField.setValue('rxjs');
    component.addTag();
    expect(component.tagList()).toEqual(['rxjs']);
    expect(component.tagField.value).toBe('');
  });

  it('should not add a duplicate or blank tag', () => {
    const { component } = configure();
    component.tagList.set(['rxjs']);
    component.tagField.setValue('rxjs');
    component.addTag();
    component.tagField.setValue('   ');
    component.addTag();
    expect(component.tagList()).toEqual(['rxjs']);
  });

  it('should remove a tag', () => {
    const { component } = configure();
    component.tagList.set(['a', 'b']);
    component.removeTag('a');
    expect(component.tagList()).toEqual(['b']);
  });

  it('should create a new article on submit when there is no slug', () => {
    const { component, articleService, router } = configure();
    articleService.create.mockReturnValue(of(article));
    component.articleForm.patchValue({ title: 'T', description: 'D', body: 'B' });
    component.submitForm();
    expect(articleService.create).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/article/', 'my-slug']);
  });

  it('should update an existing article on submit when a slug is present', () => {
    const { component, articleService, router } = configure('my-slug');
    articleService.update.mockReturnValue(of(article));
    component.articleForm.patchValue({ title: 'T2', description: 'D2', body: 'B2' });
    component.submitForm();
    expect(articleService.update).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/article/', 'my-slug']);
  });

  it('should surface errors and reset submitting on failure', () => {
    const { component, articleService } = configure();
    articleService.create.mockReturnValue(throwError(() => ({ errors: { title: ["can't be blank"] } })));
    component.submitForm();
    expect(component.errors()).toEqual({ errors: { title: ["can't be blank"] } });
    expect(component.isSubmitting()).toBe(false);
  });
});
