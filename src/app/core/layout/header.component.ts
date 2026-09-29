import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserService } from '../auth/services/user.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DefaultImagePipe } from '../../shared/pipes/default-image.pipe';

@Component({
  selector: 'app-layout-header',
  templateUrl: './header.component.html',
  imports: [RouterLinkActive, RouterLink, DefaultImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private userService = inject(UserService);
  currentUser = this.userService.user;
  authState = this.userService.authStatus;
}
