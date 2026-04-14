import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from './core/layout/header.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './core/layout/footer.component';
import { TestComponent } from './components/test/test.component';
import { TestDirectiveComponent } from './components/test-directive/test-directive.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [HeaderComponent, RouterOutlet, FooterComponent, TestComponent, TestDirectiveComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
