import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ListErrorsComponent } from './list-errors.component';

describe('ListErrorsComponent', () => {
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

  it('should map error object to error list', () => {
    const component = new ListErrorsComponent();
    component.errors = { errors: { email: 'is invalid', password: 'is too short' } };
    expect(component.errorList).toEqual(['email is invalid', 'password is too short']);
  });

  it('should clear the list when errors is null', () => {
    const component = new ListErrorsComponent();
    component.errors = { errors: { email: 'is invalid' } };
    component.errors = null;
    expect(component.errorList).toEqual([]);
  });

  it('should handle missing errors property', () => {
    const component = new ListErrorsComponent();
    component.errors = {} as any;
    expect(component.errorList).toEqual([]);
  });

  it('should render error messages', async () => {
    await TestBed.configureTestingModule({ imports: [ListErrorsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ListErrorsComponent);
    fixture.componentInstance.errors = { errors: { email: 'is invalid' } };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('email is invalid');
  });
});
