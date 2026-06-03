import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

/**
 * Initialise the Angular testing environment exactly once per test file.
 * Safe to call multiple times — subsequent calls are ignored.
 */
export function initTestBed(): void {
  try {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  } catch {
    // Already initialised for this test file — nothing to do.
  }
}
