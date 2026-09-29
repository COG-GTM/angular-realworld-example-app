import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from './toast.service';

describe('ToastContainerComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    toastService.clear();
    TestBed.resetTestingModule();
  });

  it('renders nothing when there are no toasts', () => {
    expect(el.querySelectorAll('.toast')).toHaveLength(0);
  });

  it('renders error toasts with role="alert" inside a live region', async () => {
    toastService.error('Something broke');
    await fixture.whenStable();

    const toast = el.querySelector('.toast.toast-error');
    expect(toast?.textContent).toContain('Something broke');
    expect(toast?.getAttribute('role')).toBe('alert');
    expect(el.querySelector('.toast-container')?.getAttribute('aria-live')).toBe('polite');
  });

  it('renders non-error toasts with role="status"', async () => {
    toastService.success('Saved');
    await fixture.whenStable();

    expect(el.querySelector('.toast.toast-success')?.getAttribute('role')).toBe('status');
  });

  it('dismisses a toast when its close button is clicked', async () => {
    toastService.error('first');
    toastService.error('second');
    await fixture.whenStable();

    const closeButtons = el.querySelectorAll<HTMLButtonElement>('.toast-close');
    closeButtons[0].click();
    await fixture.whenStable();

    const messages = Array.from(el.querySelectorAll('.toast-message')).map(m => m.textContent?.trim());
    expect(messages).toEqual(['second']);
  });
});
