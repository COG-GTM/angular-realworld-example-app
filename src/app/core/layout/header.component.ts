import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserService } from '../auth/services/user.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { DefaultImagePipe } from '../../shared/pipes/default-image.pipe';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  imports: [RouterLinkActive, RouterLink, AsyncPipe, DefaultImagePipe],
  styles: [
    `
      .theme-toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0.25rem 0.4rem;
        color: rgba(0, 0, 0, 0.3);
        transition: color 0.15s ease;
        line-height: 1;
      }
      .theme-toggle:hover {
        color: rgba(0, 0, 0, 0.6);
      }
      :host-context(html.dark) .theme-toggle {
        color: rgba(255, 255, 255, 0.45);
      }
      :host-context(html.dark) .theme-toggle:hover {
        color: rgba(255, 255, 255, 0.7);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private userService = inject(UserService);
  themeService = inject(ThemeService);
  currentUser$ = this.userService.currentUser;
  authState$ = this.userService.authState;
}
