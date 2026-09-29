import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export const DEFAULT_TOAST_DURATION_MS = 5000;
export const MAX_TOASTS = 4;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly toasts = this.toastsSignal.asReadonly();

  /**
   * Shows a toast. Identical messages already on screen are not duplicated;
   * their dismiss timer is restarted instead. Pass `durationMs: 0` to keep the
   * toast until dismissed manually.
   */
  show(message: string, type: ToastType = 'info', durationMs = DEFAULT_TOAST_DURATION_MS): number {
    const existing = this.toastsSignal().find(t => t.message === message && t.type === type);
    const id = existing?.id ?? this.nextId++;

    if (!existing) {
      this.toastsSignal.update(toasts => {
        const next = [...toasts, { id, type, message }];
        const overflow = next.slice(0, Math.max(0, next.length - MAX_TOASTS));
        overflow.forEach(t => this.clearTimer(t.id));
        return next.slice(-MAX_TOASTS);
      });
    }

    this.clearTimer(id);
    if (durationMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), durationMs),
      );
    }
    return id;
  }

  success(message: string, durationMs?: number): number {
    return this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number): number {
    return this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs?: number): number {
    return this.show(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.toastsSignal.set([]);
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
