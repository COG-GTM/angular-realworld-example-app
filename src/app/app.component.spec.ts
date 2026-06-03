import '../testing/setup-test-bed';
import { describe, it, expect } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('should create the app', () => {
    expect(new AppComponent()).toBeTruthy();
  });
});
