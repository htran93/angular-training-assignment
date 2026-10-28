import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent {
  @Input({ required: true }) label!: string;
  @Input() value = 0;
  @Input() max = 100;
  @Input() valueText: string | null = null;
  @Input() overBudget = false;

  get accessibleValue(): number {
    return Math.min(Math.max(this.value, 0), this.max);
  }

  get fillPercentage(): number {
    return this.max > 0 ? (this.accessibleValue / this.max) * 100 : 0;
  }

  get accessibleText(): string {
    return this.valueText ?? `${this.value}%`;
  }
}
