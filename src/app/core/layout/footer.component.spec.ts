import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FooterComponent } from './footer.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

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
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have today property set to a timestamp', () => {
    expect(component.today).toBeDefined();
    expect(typeof component.today).toBe('number');
    expect(component.today).toBeGreaterThan(0);
  });

  it('should render a footer element', () => {
    const footer = fixture.debugElement.query(By.css('footer'));
    expect(footer).toBeTruthy();
  });

  it('should render logo link with routerLink to home', () => {
    const logoLink = fixture.debugElement.query(By.css('a.logo-font'));
    expect(logoLink).toBeTruthy();
  });

  it('should render attribution text', () => {
    const attribution = fixture.debugElement.query(By.css('.attribution'));
    expect(attribution).toBeTruthy();
    expect(attribution.nativeElement.textContent).toContain('An interactive learning project');
  });

  it('should display the current year', () => {
    const attribution = fixture.debugElement.query(By.css('.attribution'));
    const currentYear = new Date().getFullYear().toString();
    expect(attribution.nativeElement.textContent).toContain(currentYear);
  });

  it('should contain a link to the RealWorld project', () => {
    const link = fixture.debugElement.query(By.css('.attribution a'));
    expect(link).toBeTruthy();
    expect(link.nativeElement.getAttribute('href')).toBe('https://github.com/gothinkster/realworld');
  });
});
