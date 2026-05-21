import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="theme-toggle" (click)="themeService.toggle()" [attr.aria-label]="label()" [title]="label()">
      {{ icon() }}
    </button>
  `,
})
export class ThemeToggleComponent {
  protected themeService = inject(ThemeService);

  protected icon = () => (this.themeService.theme() === 'light' ? '\u{1F319}' : '\u{2600}\u{FE0F}');
  protected label = () => (this.themeService.theme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
}
