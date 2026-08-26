import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestingModule {}

try {
  getTestBed().initTestEnvironment([BrowserTestingModule, ZonelessTestingModule], platformBrowserTesting(), {
    teardown: { destroyAfterEach: true },
  });
} catch (error) {
  console.error('TestBed initialization failed:', error);
}
