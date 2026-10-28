import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  inject,
  Input
} from '@angular/core';
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
  @ViewChild('amountInput') private amountElement?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) inputId!: string;
  @Input() describedBy: string | null = null;
  @Input() placeholder = '';
  @Input() required = false;
  @Input() invalid = false;
  @Input() currencyLabel = 'VND';
  @Input() groupThousands = false;

  value = '';
  disabled = false;

  get displayValue(): string {
    return this.groupThousands && /^[0-9]+$/.test(this.value)
      ? this.groupDigitString(this.value)
      : this.value;
  }

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

  focus(): void {
    this.amountElement?.nativeElement.focus();
  }

  onInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const enteredValue = input.value;
    if (
      !this.groupThousands ||
      !/^[0-9.]*$/.test(enteredValue) ||
      !this.isGroupingValue(enteredValue, event)
    ) {
      this.value = enteredValue;
      this.onChange(this.value);
      return;
    }

    const digitCountBeforeCaret = enteredValue
      .slice(0, input.selectionStart ?? enteredValue.length)
      .replace(/\./g, '')
      .length;
    this.value = enteredValue.replace(/\./g, '');
    this.onChange(this.value);

    const formattedValue = this.groupDigitString(this.value);
    input.value = formattedValue;
    const caretPosition = this.positionAfterDigitCount(formattedValue, digitCountBeforeCaret);
    input.setSelectionRange(caretPosition, caretPosition);
  }

  private isGroupingValue(value: string, event: Event): boolean {
    if (!value.includes('.')) {
      return true;
    }
    if (/^[0-9]{1,3}(?:\.[0-9]{3})+$/.test(value)) {
      return true;
    }

    const inputEvent = event as InputEvent;
    const previousValueWasGrouped = this.displayValue.includes('.');
    const insertedDigit = inputEvent.inputType === 'insertText' && /^[0-9]$/.test(inputEvent.data ?? '');
    const deletedContent = inputEvent.inputType.startsWith('delete');
    return previousValueWasGrouped && (insertedDigit || deletedContent);
  }

  private groupDigitString(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private positionAfterDigitCount(value: string, digitCount: number): number {
    if (digitCount === 0) {
      return 0;
    }

    let digitsSeen = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] >= '0' && value[index] <= '9') {
        digitsSeen += 1;
        if (digitsSeen === digitCount) {
          return index + 1;
        }
      }
    }
    return value.length;
  }

  onBlur(): void {
    this.onTouched();
  }
}
