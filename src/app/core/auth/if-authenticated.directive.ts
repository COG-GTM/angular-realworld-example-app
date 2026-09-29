import { Directive, effect, Input, signal, TemplateRef, untracked, ViewContainerRef } from '@angular/core';
import { UserService } from './services/user.service';

@Directive({
  selector: '[ifAuthenticated]',
  standalone: true,
})
export class IfAuthenticatedDirective<T> {
  constructor(
    private templateRef: TemplateRef<T>,
    private userService: UserService,
    private viewContainer: ViewContainerRef,
  ) {}

  condition = signal(false);
  hasView = signal(false);

  private readonly viewSync = effect(() => {
    const isAuthenticated = this.userService.authenticated();
    const condition = this.condition();
    const shouldShow = isAuthenticated === condition;

    untracked(() => {
      if (shouldShow && !this.hasView()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView.set(true);
      } else if (!shouldShow && this.hasView()) {
        this.viewContainer.clear();
        this.hasView.set(false);
      }
    });
  });

  @Input() set ifAuthenticated(condition: boolean) {
    this.condition.set(condition);
  }
}
