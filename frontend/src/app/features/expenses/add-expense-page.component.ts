import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { JarCardComponent } from '../../shared/components/jar-card/jar-card.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { StatePanelComponent } from '../../shared/components/state-panel/state-panel.component';
import { VndAmountInputComponent } from '../../shared/components/vnd-amount-input/vnd-amount-input.component';
import { JarType } from '../../shared/models/jar-type';
import { VndAmountPipe } from '../../shared/pipes/vnd-amount.pipe';
import { BudgetPlanApiService } from '../monthly-planning/data-access/budget-plan-api.service';
import { InvalidBudgetPlanResponseError, MonthlyPlanJar, MonthlyPlanResponse } from '../monthly-planning/models/budget-plan.models';
import {
  CreateExpenseRequest,
  InvalidExpenseResponseError,
  JarSpendingSummary,
  isValidExpenseDate
} from './models/expense.models';

type PlanState = 'idle' | 'loading' | 'ready' | 'missing' | 'error' | 'invalid';
type ExpenseField = 'expenseDate' | 'jarType' | 'amountVnd' | 'description';
type ExpenseFieldErrors = Partial<Record<ExpenseField, string>>;

const MAX_INT64 = '9223372036854775807';
const jarTypes = new Set<string>([
  'livingExpenses',
  'food',
  'children',
  'emergencyFund',
  'savings',
  'investment',
  'entertainmentAndTravel'
]);

function isJarType(value: string | null): value is JarType {
  return value !== null && jarTypes.has(value);
}

function dateValidator(): ValidatorFn {
  return control => control.value === '' || isValidExpenseDate(control.value) ? null : { invalidDate: true };
}

function amountValidator(): ValidatorFn {
  return control => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }
    if (!/^[0-9]+$/.test(value)) {
      return { digitsOnly: true };
    }
    if (!/[1-9]/.test(value)) {
      return { positive: true };
    }
    const canonicalValue = value.replace(/^0+(?=\d)/, '');
    if (
      canonicalValue.length > MAX_INT64.length ||
      (canonicalValue.length === MAX_INT64.length && canonicalValue > MAX_INT64)
    ) {
      return { maximum: true };
    }
    return null;
  };
}

function descriptionValidator(): ValidatorFn {
  return control => {
    const value: unknown = control.value;
    if (typeof value !== 'string') {
      return { required: true };
    }
    if (value.trim().length === 0) {
      return { required: true };
    }
    return Array.from(value).length > 500 ? { maxlength: true } : null;
  };
}

function apiErrorCode(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const code = Reflect.get(value, 'code');
  return typeof code === 'string' ? code : null;
}

function apiFieldErrors(value: unknown): Array<{ field: string; code: string }> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [];
  }
  const errors: unknown = Reflect.get(value, 'errors');
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.flatMap(error => {
    if (typeof error !== 'object' || error === null || Array.isArray(error)) {
      return [];
    }
    const field = Reflect.get(error, 'field');
    const code = Reflect.get(error, 'code');
    return typeof field === 'string' && typeof code === 'string' ? [{ field, code }] : [];
  });
}

function fieldErrorMessage(field: string, code: string): string | null {
  switch (field) {
    case 'expenseDate':
      return 'Select a valid expense date.';
    case 'jarType':
      return code === 'JAR_NOT_IN_MONTHLY_PLAN'
        ? 'This jar is not part of the selected monthly plan. Choose a jar again.'
        : 'Select a jar from this monthly plan.';
    case 'amountVnd':
      return code === 'MUST_BE_POSITIVE'
        ? 'Amount must be greater than zero.'
        : 'Enter a positive whole-VND amount using digits only.';
    case 'description':
      return code === 'TOO_LONG'
        ? 'Description must be 500 characters or fewer.'
        : 'Enter a description for this expense.';
    default:
      return null;
  }
}

@Component({
  selector: 'app-add-expense-page',
  standalone: true,
  imports: [
    AppShellComponent,
    FormFieldComponent,
    JarCardComponent,
    PanelComponent,
    ReactiveFormsModule,
    RouterLink,
    StatePanelComponent,
    VndAmountInputComponent,
    VndAmountPipe
  ],
  templateUrl: './add-expense-page.component.html',
  styleUrl: './add-expense-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddExpensePageComponent implements OnInit {
  @ViewChild('expenseDateInput') private expenseDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('jarSelect') private jarSelect?: ElementRef<HTMLSelectElement>;
  @ViewChild(VndAmountInputComponent) private amountInput?: VndAmountInputComponent;
  @ViewChild('descriptionInput') private descriptionInput?: ElementRef<HTMLTextAreaElement>;

  readonly expenseDateControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, dateValidator()]
  });
  readonly jarTypeControl = new FormControl<JarType | null>(
    { value: null, disabled: true },
    Validators.required
  );
  readonly amountControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, amountValidator()]
  });
  readonly descriptionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, descriptionValidator()]
  });
  readonly form = new FormGroup({
    expenseDate: this.expenseDateControl,
    jarType: this.jarTypeControl,
    amountVnd: this.amountControl,
    description: this.descriptionControl
  });

  readonly planState = signal<PlanState>('idle');
  readonly plan = signal<MonthlyPlanResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly planError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly saveSuccess = signal<string | null>(null);
  readonly serverFieldErrors = signal<ExpenseFieldErrors>({});
  readonly selectedJarType = signal<JarType | null>(null);
  readonly spendingSummary = signal<JarSpendingSummary | null>(null);
  readonly selectedJar = computed(() => {
    const selectedType = this.selectedJarType();
    return selectedType ? this.plan()?.jars.find(jar => jar.jarType === selectedType) ?? null : null;
  });

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(BudgetPlanApiService);
  private readonly destroyRef = inject(DestroyRef);
  private submitted = false;
  private requestedJarType: JarType | null = null;
  private requestedPlanPeriod: string | null = null;
  private planRequestId = 0;

  ngOnInit(): void {
    this.expenseDateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.clearFieldError('expenseDate');
        this.clearSaveFeedback();
        this.loadPlanForDate(value);
      });

    this.jarTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.selectedJarType.set(value);
        this.clearFieldError('jarType');
        this.clearSaveFeedback();
      });

    this.amountControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearFieldError('amountVnd');
        this.clearSaveFeedback();
      });

    this.descriptionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearFieldError('description');
        this.clearSaveFeedback();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const requestedJarType = params.get('jarType');
        this.requestedJarType = isJarType(requestedJarType) ? requestedJarType : null;
        const requestedDate = params.get('expenseDate');
        const expenseDate = isValidExpenseDate(requestedDate) ? requestedDate : '';
        if (expenseDate !== this.expenseDateControl.value) {
          this.expenseDateControl.setValue(expenseDate);
        } else if (expenseDate) {
          this.applyRequestedJar();
        }
      });
  }

  get expenseDateErrorMessage(): string | null {
    return this.getControlError('expenseDate', this.expenseDateControl, {
      required: 'Select the date of this expense.',
      invalidDate: 'Enter a valid calendar date.'
    });
  }

  get jarTypeErrorMessage(): string | null {
    return this.getControlError('jarType', this.jarTypeControl, {
      required: 'Select a jar from this monthly plan.'
    });
  }

  get amountErrorMessage(): string | null {
    return this.getControlError('amountVnd', this.amountControl, {
      required: 'Enter the expense amount.',
      digitsOnly: 'Use digits only; do not enter decimals or signs.',
      positive: 'Amount must be greater than zero.',
      maximum: 'Amount exceeds the maximum supported value.'
    });
  }

  get descriptionErrorMessage(): string | null {
    return this.getControlError('description', this.descriptionControl, {
      required: 'Enter a description for this expense.',
      maxlength: 'Description must be 500 characters or fewer.'
    });
  }

  get descriptionLength(): number {
    return Array.from(this.descriptionControl.value).length;
  }

  retryPlan(): void {
    this.loadPlanForDate(this.expenseDateControl.value, true);
  }

  submit(): void {
    this.submitted = true;
    this.submitError.set(null);
    this.serverFieldErrors.set({});

    if (this.planState() !== 'ready' || this.isSubmitting()) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.focusFirstInvalidControl();
      return;
    }

    const date = this.expenseDateControl.value;
    const jarType = this.jarTypeControl.value;
    const selectedJar = this.plan()?.jars.find(jar => jar.jarType === jarType);
    if (!isValidExpenseDate(date) || !jarType || !selectedJar) {
      this.jarTypeControl.setErrors({ required: true });
      this.jarTypeControl.markAsTouched();
      this.focusFirstInvalidControl();
      return;
    }

    const request: CreateExpenseRequest = {
      expenseDate: date,
      jarType,
      amountVnd: this.amountControl.value.replace(/^0+(?=\d)/, ''),
      description: this.descriptionControl.value.trim()
    };

    this.isSubmitting.set(true);
    this.form.disable();
    this.api.createExpense(request)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.isSubmitting.set(false);
          this.form.enable({ emitEvent: false });
          if (
            response.expense.expenseDate !== request.expenseDate ||
            response.expense.jarType !== request.jarType ||
            response.expense.amountVnd !== request.amountVnd ||
            response.expense.description !== request.description ||
            response.jarSummary.jarType !== request.jarType ||
            response.jarSummary.jarName !== selectedJar.name
          ) {
            this.submitError.set('The server response could not be verified. The expense may have been saved; check the selected jar totals before trying again.');
            return;
          }

          this.spendingSummary.set(response.jarSummary);
          this.saveSuccess.set('Expense saved. The selected jar totals have been refreshed.');
          this.submitted = false;
          this.amountControl.setValue('', { emitEvent: false });
          this.descriptionControl.setValue('', { emitEvent: false });
          this.amountControl.markAsPristine();
          this.amountControl.markAsUntouched();
          this.descriptionControl.markAsPristine();
          this.descriptionControl.markAsUntouched();
        },
        error: error => this.handleCreateError(error)
      });
  }

  private loadPlanForDate(date: string, force = false): void {
    if (!isValidExpenseDate(date)) {
      this.planRequestId += 1;
      this.requestedPlanPeriod = null;
      this.plan.set(null);
      this.planState.set('idle');
      this.planError.set(null);
      this.selectedJarType.set(null);
      this.jarTypeControl.setValue(null, { emitEvent: false });
      this.jarTypeControl.disable({ emitEvent: false });
      return;
    }

    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const period = `${year}-${month}`;
    if (!force && period === this.requestedPlanPeriod && ['loading', 'ready'].includes(this.planState())) {
      return;
    }

    const requestId = ++this.planRequestId;
    if (period !== this.requestedPlanPeriod) {
      this.clearFieldError('jarType');
    }
    this.requestedPlanPeriod = period;
    this.plan.set(null);
    this.planState.set('loading');
    this.planError.set(null);
    this.selectedJarType.set(null);
    this.jarTypeControl.setValue(null, { emitEvent: false });
    this.jarTypeControl.disable({ emitEvent: false });

    this.api.getMonthlyPlan(year, month)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: plan => {
          if (requestId !== this.planRequestId) {
            return;
          }
          if (plan.year !== year || plan.month !== month) {
            this.planState.set('invalid');
            this.planError.set('The server returned a plan for a different month. No jars are available until the plan can be verified.');
            return;
          }
          this.plan.set(plan);
          this.planState.set('ready');
          this.jarTypeControl.enable({ emitEvent: false });
          this.applyRequestedJar();
        },
        error: error => {
          if (requestId !== this.planRequestId) {
            return;
          }
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.planState.set('missing');
            this.planError.set('Create a monthly plan before adding an expense.');
          } else if (error instanceof InvalidBudgetPlanResponseError) {
            this.planState.set('invalid');
            this.planError.set('The monthly plan data could not be verified. Try loading it again.');
          } else {
            this.planState.set('error');
            this.planError.set('We could not load this monthly plan. Check your connection and try again.');
          }
        }
      });
  }

  private applyRequestedJar(): void {
    const plan = this.plan();
    if (!plan || !this.requestedJarType) {
      return;
    }
    const jar = plan.jars.find(item => item.jarType === this.requestedJarType);
    if (jar) {
      this.jarTypeControl.setValue(jar.jarType);
    }
  }

  private handleCreateError(error: unknown): void {
    this.isSubmitting.set(false);
    this.form.enable({ emitEvent: false });
    if (error instanceof InvalidExpenseResponseError) {
      this.submitError.set('The server response could not be verified. The expense may have been saved; check the selected jar totals before trying again.');
      return;
    }

    const code = error instanceof HttpErrorResponse ? apiErrorCode(error.error) : null;
    if (error instanceof HttpErrorResponse && (error.status === 404 || code === 'MONTHLY_PLAN_NOT_FOUND')) {
      this.planRequestId += 1;
      this.plan.set(null);
      this.planState.set('missing');
      this.planError.set('Create a monthly plan before adding an expense.');
      this.selectedJarType.set(null);
      this.jarTypeControl.setValue(null);
      this.jarTypeControl.disable({ emitEvent: false });
      this.spendingSummary.set(null);
      return;
    }
    if (error instanceof HttpErrorResponse && code === 'JAR_NOT_IN_MONTHLY_PLAN') {
      this.requestedJarType = null;
      this.jarTypeControl.setValue(null);
      this.jarTypeControl.markAsTouched();
      this.setServerFieldError('jarType', 'JAR_NOT_IN_MONTHLY_PLAN');
      this.loadPlanForDate(this.expenseDateControl.value, true);
      return;
    }
    if (error instanceof HttpErrorResponse && (error.status === 400 || code === 'VALIDATION_ERROR')) {
      const fieldErrors = apiFieldErrors(error.error);
      let mappedFieldCount = 0;
      for (const fieldError of fieldErrors) {
        if (this.setServerFieldError(fieldError.field, fieldError.code)) {
          mappedFieldCount += 1;
        }
      }
      if (mappedFieldCount === 0) {
        this.submitError.set('The server rejected the expense details. Check each required field and try again.');
      }
      this.focusFirstInvalidControl();
      return;
    }

    this.submitError.set('We could not confirm whether the expense was saved. Check the selected jar totals before trying again.');
  }

  private getControlError(
    field: ExpenseField,
    control: FormControl<string | JarType | null>,
    messages: Record<string, string>
  ): string | null {
    const serverError = this.serverFieldErrors()[field];
    if (serverError) {
      return serverError;
    }
    if (!this.submitted && !control.touched) {
      return null;
    }
    for (const [errorName, message] of Object.entries(messages)) {
      if (control.hasError(errorName)) {
        return message;
      }
    }
    return null;
  }

  private setServerFieldError(field: string, code: string): boolean {
    const message = fieldErrorMessage(field, code);
    if (!message) {
      return false;
    }
    this.serverFieldErrors.update(current => ({ ...current, [field]: message }));
    return true;
  }

  private clearFieldError(field: ExpenseField): void {
    this.serverFieldErrors.update(current => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  private clearSaveFeedback(): void {
    this.saveSuccess.set(null);
    this.submitError.set(null);
    this.spendingSummary.set(null);
  }

  private focusFirstInvalidControl(): void {
    const errors = this.serverFieldErrors();
    if (this.expenseDateControl.invalid || errors['expenseDate']) {
      this.expenseDateInput?.nativeElement.focus();
      return;
    }
    if (this.jarTypeControl.invalid || errors['jarType']) {
      this.jarSelect?.nativeElement.focus();
      return;
    }
    if (this.amountControl.invalid || errors['amountVnd']) {
      this.amountInput?.focus();
      return;
    }
    if (this.descriptionControl.invalid || errors['description']) {
      this.descriptionInput?.nativeElement.focus();
    }
  }
}
