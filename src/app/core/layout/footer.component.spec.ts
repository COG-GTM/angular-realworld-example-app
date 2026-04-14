import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FooterComponent, RouterTestingModule],
    });

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a today property set to a timestamp', () => {
    expect(component.today).toBeDefined();
    expect(typeof component.today).toBe('number');
  });

  it('should have today set to approximately the current date', () => {
    const now = Date.now();
    // Allow 5 seconds tolerance
    expect(Math.abs(component.today - now)).toBeLessThan(5000);
  });

  it('should render the footer element', () => {
    fixture.detectChanges();
    const footerEl = fixture.nativeElement as HTMLElement;
    expect(footerEl).toBeTruthy();
  });
});
