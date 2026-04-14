import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { VERSION } from '@angular/core';
import { TestComponent } from './test.component';

describe('TestComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have version equal to VERSION.full', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    expect(component.version).toBe(VERSION.full);
  });

  it('should render Angular Version inside [data-testid="angular-version"]', () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const versionEl = el.querySelector('[data-testid="angular-version"]');
    expect(versionEl).toBeTruthy();
    expect(versionEl!.textContent).toContain(`Angular Version: ${VERSION.full}`);
  });

  it('should call console.info on ngOnInit', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('test-component initialized...');
    spy.mockRestore();
  });
});
