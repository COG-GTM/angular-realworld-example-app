import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

describe('AppModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should compile successfully', () => {
    const module = TestBed.inject(AppModule);
    expect(module).toBeTruthy();
  });

  it('should bootstrap and render App, TestComponent, and TestDirectiveComponent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    // AppComponent renders
    expect(el).toBeTruthy();

    // TestComponent renders
    const testComp = el.querySelector('app-test');
    expect(testComp).toBeTruthy();

    // TestDirectiveComponent renders
    const testDirectiveComp = el.querySelector('app-test-directive');
    expect(testDirectiveComp).toBeTruthy();
  });
});
