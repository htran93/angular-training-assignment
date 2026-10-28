import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormFieldComponent {
  @Input({ required: true }) controlId!: string;
  @Input({ required: true }) label!: string;
  @Input() required = false;
  @Input() helpText: string | null = null;
  @Input() errorMessage: string | null = null;

  get describedBy(): string | null {
    const ids: string[] = [];
    if (this.helpText) {
      ids.push(`${this.controlId}-help`);
    }
    if (this.errorMessage) {
      ids.push(`${this.controlId}-error`);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  }
}
