import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ListErrorsComponent } from './list-errors.component';
import { Errors } from '../../core/models/errors.model';

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
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an empty errorList by default', () => {
    expect(component.errorList).toEqual([]);
  });

  it('should parse errors into errorList', () => {
    const errors: Errors = { errors: { email: 'is required', password: 'is too short' } };
    component.errors = errors;
    expect(component.errorList.length).toBe(2);
    expect(component.errorList).toContain('email is required');
    expect(component.errorList).toContain('password is too short');
  });

  it('should handle null errors', () => {
    component.errors = null;
    expect(component.errorList).toEqual([]);
  });

  it('should handle errors with empty errors object', () => {
    const errors: Errors = { errors: {} };
    component.errors = errors;
    expect(component.errorList).toEqual([]);
  });

  it('should handle single error', () => {
    const errors: Errors = { errors: { username: 'already taken' } };
    component.errors = errors;
    expect(component.errorList).toEqual(['username already taken']);
  });

  it('should update errorList when errors input changes', () => {
    component.errors = { errors: { field1: 'error1' } };
    expect(component.errorList.length).toBe(1);

    component.errors = { errors: { field2: 'error2', field3: 'error3' } };
    expect(component.errorList.length).toBe(2);
  });

  it('should clear errorList when errors set to null', () => {
    component.errors = { errors: { field1: 'error1' } };
    expect(component.errorList.length).toBe(1);

    component.errors = null;
    expect(component.errorList).toEqual([]);
  });

  it('should handle errors object without errors property', () => {
    component.errors = { errors: undefined as any };
    expect(component.errorList).toEqual([]);
  });

  it('should handle errors with null errors property', () => {
    component.errors = { errors: null as any };
    expect(component.errorList).toEqual([]);
  });
});
