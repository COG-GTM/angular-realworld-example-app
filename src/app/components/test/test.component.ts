import { ChangeDetectionStrategy, Component, OnInit, VERSION } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestComponent implements OnInit {
  version = VERSION.full;

  ngOnInit(): void {
    console.info('test-component initialized...');
  }
}
