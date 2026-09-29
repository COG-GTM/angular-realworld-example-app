import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DEFAULT_TOAST_DURATION_MS, MAX_TOASTS, ToastService } from './toast.service';

describe('ToastService', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('adds typed toasts', () => {
    service.error('bad');
    service.success('good');
    service.info('fyi');

    expect(service.toasts().map(t => [t.type, t.message])).toEqual([
      ['error', 'bad'],
      ['success', 'good'],
      ['info', 'fyi'],
    ]);
  });

  it('auto-dismisses after the default duration', () => {
    service.error('bad');

    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS - 1);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps sticky toasts (duration 0) until dismissed', () => {
    const id = service.error('sticky', 0);

    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS * 10);
    expect(service.toasts()).toHaveLength(1);

    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
  });

  it('does not duplicate an identical toast and restarts its timer', () => {
    const first = service.error('Server error');
    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS - 100);

    const second = service.error('Server error');

    expect(second).toBe(first);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(DEFAULT_TOAST_DURATION_MS - 1);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('treats the same message with a different type as distinct', () => {
    service.error('Saved?');
    service.success('Saved?');
    expect(service.toasts()).toHaveLength(2);
  });

  it(`caps the number of visible toasts at ${MAX_TOASTS}, dropping the oldest`, () => {
    for (let i = 0; i < MAX_TOASTS + 2; i++) {
      service.error(`error ${i}`);
    }

    expect(service.toasts().map(t => t.message)).toEqual(
      Array.from({ length: MAX_TOASTS }, (_, i) => `error ${i + 2}`),
    );
  });

  it('dismiss() ignores unknown ids', () => {
    service.error('bad');
    service.dismiss(9999);
    expect(service.toasts()).toHaveLength(1);
  });
});
