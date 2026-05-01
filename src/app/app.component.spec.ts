import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from './core/auth/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser: new BehaviorSubject(null).asObservable().pipe(distinctUntilChanged()),
            authState: new BehaviorSubject('loading').asObservable().pipe(distinctUntilChanged()),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header component', () => {
    const header = fixture.debugElement.query(By.css('app-layout-header'));
    expect(header).toBeTruthy();
  });

  it('should render the router outlet', () => {
    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(routerOutlet).toBeTruthy();
  });

  it('should render the footer component', () => {
    const footer = fixture.debugElement.query(By.css('app-layout-footer'));
    expect(footer).toBeTruthy();
  });
});
