import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ListErrorsComponent } from './list-errors.component';
import { By } from '@angular/platform-browser';

describe('ListErrorsComponent', () => {
  let component: ListErrorsComponent;
  let fixture: ComponentFixture<ListErrorsComponent>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ListErrorsComponent],
    });

    fixture = TestBed.createComponent(ListErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have an empty errorList by default', () => {
    expect(component.errorList).toEqual([]);
  });

  it('should render no list items when errorList is empty', () => {
    const items = fixture.debugElement.queryAll(By.css('.error-messages li'));
    expect(items.length).toBe(0);
  });

  describe('when errors are set', () => {
    it('should format errors as "key value" strings', () => {
      component.errors = { errors: { email: 'is required', password: 'is too short' } };
      expect(component.errorList).toEqual(['email is required', 'password is too short']);
    });

    it('should render error list items', () => {
      fixture.componentRef.setInput('errors', { errors: { email: 'is required' } });
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.error-messages li'));
      expect(items.length).toBe(1);
      expect(items[0].nativeElement.textContent).toContain('email is required');
    });

    it('should render multiple error items', () => {
      fixture.componentRef.setInput('errors', { errors: { email: 'is required', password: 'is too short' } });
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.error-messages li'));
      expect(items.length).toBe(2);
    });
  });

  describe('when errors are cleared', () => {
    it('should clear errorList when null is set', () => {
      component.errors = { errors: { email: 'is required' } };
      expect(component.errorList.length).toBe(1);
      component.errors = null;
      expect(component.errorList).toEqual([]);
    });

    it('should render no list items after clearing errors', () => {
      fixture.componentRef.setInput('errors', { errors: { email: 'is required' } });
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.error-messages li')).length).toBe(1);

      fixture.componentRef.setInput('errors', null);
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.error-messages li')).length).toBe(0);
    });
  });

  it('should handle errors with empty errors object', () => {
    component.errors = { errors: {} };
    expect(component.errorList).toEqual([]);
  });
});
