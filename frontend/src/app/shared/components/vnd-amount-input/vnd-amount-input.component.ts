import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function isValueChangeHandler(value: unknown): value is (value: string) => void {
  return typeof value === 'function';
}

function isTouchedHandler(value: unknown): value is () => void {
  return typeof value === 'function';
}

@Component({
  selector: 'app-vnd-amount-input',
  standalone: true,
  templateUrl: './vnd-amount-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VndAmountInputComponent),
      multi: true
    }
  ]
})
export class VndAmountInputComponent implements ControlValueAccessor {
  @Input({ required: true }) id!: string;
  @Input() describedBy: string | null = null;
  @Input() placeholder = '';
  @Input() required = false;
  @Input() invalid = false;
  @Input() currencyLabel = 'VND';

  value = '';
  disabled = false;

  private readonly changeDetector = inject(ChangeDetectorRef);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    if (value !== null && value !== undefined && typeof value !== 'string') {
      throw new TypeError('VND amount form values must be strings.');
    }
    this.value = value ?? '';
    this.changeDetector.markForCheck();
  }

  registerOnChange(handler: unknown): void {
    if (!isValueChangeHandler(handler)) {
      throw new TypeError('VND amount input requires a change handler.');
    }
    this.onChange = handler;
  }

  registerOnTouched(handler: unknown): void {
    if (!isTouchedHandler(handler)) {
      throw new TypeError('VND amount input requires a touched handler.');
    }
    this.onTouched = handler;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.changeDetector.markForCheck();
  }

  onInput(event: Event): void {
    this.value = (event.currentTarget as HTMLInputElement).value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
