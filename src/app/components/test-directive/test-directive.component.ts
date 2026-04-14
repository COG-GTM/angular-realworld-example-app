import { ChangeDetectionStrategy, Component, VERSION } from '@angular/core';

@Component({
  selector: 'app-test-directive',
  templateUrl: './test-directive.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestDirectiveComponent {
  version = VERSION.full;

  constructor() {
    console.info('test-directive initialized...');
  }
}
