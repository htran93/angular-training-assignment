import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface MonthOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-month-selector',
  standalone: true,
  templateUrl: './month-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthSelectorComponent {
  @Input() id = 'plan-month';
  @Input() label = 'Month';
  @Input() value: string | null = null;
  @Input() options: readonly MonthOption[] = [];
  @Input() placeholder = 'Select month';
  @Input() disabled = false;
  @Input() required = false;
  @Input() describedBy: string | null = null;

  @Output() readonly valueChange = new EventEmitter<string | null>();

  onChange(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    this.valueChange.emit(value.length > 0 ? value : null);
  }
}
