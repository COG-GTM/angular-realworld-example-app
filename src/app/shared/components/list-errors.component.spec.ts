import { describe, it, expect, beforeEach } from 'vitest';
import { ListErrorsComponent } from './list-errors.component';

describe('ListErrorsComponent', () => {
  let component: ListErrorsComponent;

  beforeEach(() => {
    component = new ListErrorsComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.errorList).toEqual([]);
  });

  it('should map an errors object into a flat list of messages', () => {
    component.errors = { errors: { email: ['is invalid'], password: ['is too short'] } };
    expect(component.errorList).toEqual(['email is invalid', 'password is too short']);
  });

  it('should produce an empty list when errors is null', () => {
    component.errors = null;
    expect(component.errorList).toEqual([]);
  });

  it('should handle an empty errors map', () => {
    component.errors = { errors: {} };
    expect(component.errorList).toEqual([]);
  });
});
