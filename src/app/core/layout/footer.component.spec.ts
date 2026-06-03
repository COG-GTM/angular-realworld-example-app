import '../../../testing/setup-test-bed';
import { describe, it, expect } from 'vitest';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  it('should create with the current timestamp', () => {
    const before = Date.now();
    const component = new FooterComponent();
    expect(component).toBeTruthy();
    expect(component.today).toBeGreaterThanOrEqual(before);
  });
});
