import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { StatePanelComponent } from './shared/components/state-panel/state-panel.component';

@Component({
  selector: 'app-route-placeholder-page',
  standalone: true,
  imports: [AppShellComponent, AsyncPipe, StatePanelComponent],
  templateUrl: './route-placeholder-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoutePlaceholderPageComponent {
  readonly pageTitle$ = inject(ActivatedRoute).data.pipe(
    map(data => typeof data['pageTitle'] === 'string' ? data['pageTitle'] : 'Page unavailable')
  );
}
