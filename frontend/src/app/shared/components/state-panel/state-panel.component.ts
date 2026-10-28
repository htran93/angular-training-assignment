import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type StatePanelVariant = 'empty' | 'error' | 'loading' | 'unavailable';

@Component({
  selector: 'app-state-panel',
  standalone: true,
  templateUrl: './state-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatePanelComponent {
  @Input() variant: StatePanelVariant = 'empty';
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;

  get role(): 'alert' | 'status' {
    return this.variant === 'error' ? 'alert' : 'status';
  }

  get liveMode(): 'assertive' | 'polite' {
    return this.variant === 'error' ? 'assertive' : 'polite';
  }
}
