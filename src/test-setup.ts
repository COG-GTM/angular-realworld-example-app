import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

console.log('🚀 Test setup file is being loaded!');

// Initialize the Angular testing environment once
try {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  });
  console.log('✅ TestBed initialized successfully');
} catch (error) {
  console.error('❌ TestBed initialization failed:', error);
}
