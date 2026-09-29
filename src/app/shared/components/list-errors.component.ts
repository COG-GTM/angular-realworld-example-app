import { ChangeDetectionStrategy, Component, ElementRef, inject, Input } from '@angular/core';
import { Errors } from '../../core/models/errors.model';

@Component({
  selector: 'app-list-errors',
  templateUrl: './list-errors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListErrorsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  errorList: string[] = [];

  @Input() set errors(errorList: Errors | null) {
    this.errorList = errorList ? Object.keys(errorList.errors || {}).map(key => `${key} ${errorList.errors[key]}`) : [];
  }

  focus(): void {
    this.host.nativeElement.querySelector<HTMLElement>('.error-messages')?.focus();
  }
}
