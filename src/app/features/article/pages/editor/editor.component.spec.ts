import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import EditorComponent from './editor.component';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;
  let articlesService: any;
  let router: any;
  let userService: any;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  function setupComponent(slug?: string) {
    articlesService = {
      get: vi.fn().mockReturnValue(
        of({
          slug: 'existing-article',
          title: 'Existing Article',
          description: 'Existing desc',
          body: 'Existing body',
          tagList: ['tag1', 'tag2'],
          author: { username: 'testuser' },
        }),
      ),
      create: vi.fn().mockReturnValue(of({ slug: 'new-article' })),
      update: vi.fn().mockReturnValue(of({ slug: 'existing-article' })),
    };
    router = { navigate: vi.fn() };
    userService = {
      getCurrentUser: vi.fn().mockReturnValue(of({ user: { username: 'testuser' } })),
    };

    TestBed.configureTestingModule({
      imports: [EditorComponent],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: Router, useValue: router },
        { provide: UserService, useValue: userService },
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
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('create mode', () => {
    beforeEach(() => {
      setupComponent();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not load article on init when no slug', () => {
      component.ngOnInit();
      expect(articlesService.get).not.toHaveBeenCalled();
    });

    it('should have empty form fields', () => {
      expect(component.articleForm.get('title')?.value).toBe('');
      expect(component.articleForm.get('description')?.value).toBe('');
      expect(component.articleForm.get('body')?.value).toBe('');
    });

    it('should have empty tag list', () => {
      expect(component.tagList()).toEqual([]);
    });

    it('should start with isSubmitting false', () => {
      expect(component.isSubmitting()).toBe(false);
    });

    it('should add a tag', () => {
      component.tagField.setValue('newtag');
      component.addTag();
      expect(component.tagList()).toEqual(['newtag']);
      expect(component.tagField.value).toBe('');
    });

    it('should not add duplicate tags', () => {
      component.tagField.setValue('tag1');
      component.addTag();
      component.tagField.setValue('tag1');
      component.addTag();
      expect(component.tagList()).toEqual(['tag1']);
    });

    it('should not add empty tags', () => {
      component.tagField.setValue('');
      component.addTag();
      expect(component.tagList()).toEqual([]);
    });

    it('should not add whitespace-only tags', () => {
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
      component.articleForm.patchValue({ title: 'New', description: 'Desc', body: 'Body' });
      component.submitForm();
      expect(articlesService.create).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/article/', 'new-article']);
    });

    it('should set errors on submit failure', () => {
      articlesService.create.mockReturnValue(throwError(() => ({ errors: { title: 'is required' } })));
      component.submitForm();
      expect(component.errors()).toBeTruthy();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      setupComponent('existing-article');
    });

    it('should load article on init when slug exists', () => {
      component.ngOnInit();
      expect(articlesService.get).toHaveBeenCalledWith('existing-article');
    });

    it('should populate form with article data', () => {
      component.ngOnInit();
      expect(component.articleForm.get('title')?.value).toBe('Existing Article');
      expect(component.articleForm.get('description')?.value).toBe('Existing desc');
      expect(component.articleForm.get('body')?.value).toBe('Existing body');
    });

    it('should populate tags from article', () => {
      component.ngOnInit();
      expect(component.tagList()).toEqual(['tag1', 'tag2']);
    });

    it('should redirect if user is not the author', () => {
      articlesService.get.mockReturnValue(
        of({
          slug: 'existing-article',
          title: 'Title',
          description: 'Desc',
          body: 'Body',
          tagList: [],
          author: { username: 'otheruser' },
        }),
      );
      component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call update on submit', () => {
      component.ngOnInit();
      component.submitForm();
      expect(articlesService.update).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/article/', 'existing-article']);
    });
  });
});
