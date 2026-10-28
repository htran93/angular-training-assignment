import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { JarCardComponent } from '../../shared/components/jar-card/jar-card.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { StatePanelComponent } from '../../shared/components/state-panel/state-panel.component';
import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { VndAmountInputComponent } from '../../shared/components/vnd-amount-input/vnd-amount-input.component';
import { BudgetPlanApiService } from './data-access/budget-plan-api.service';
import {
  DefaultJarsResponse,
  InvalidBudgetPlanResponseError
} from './models/budget-plan.models';

type DefaultsState = 'loading' | 'ready' | 'error';

const MAX_INT64 = '9223372036854775807';

function isValidMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year >= 1 && year <= 9999 && month >= 1 && month <= 12;
}

function monthValidator(): ValidatorFn {
  return control => typeof control.value === 'string' && isValidMonth(control.value)
    ? null
    : { invalidMonth: true };
}

function incomeValidator(): ValidatorFn {
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

function currentMonthValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${today.getFullYear()}-${month}`;
}

function apiErrorCode(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const code = Reflect.get(value, 'code');
  return typeof code === 'string' ? code : null;
}

@Component({
  selector: 'app-monthly-planning-page',
  standalone: true,
  imports: [
    AppShellComponent,
    FormFieldComponent,
    JarCardComponent,
    PanelComponent,
    ReactiveFormsModule,
    RouterLink,
    StatePanelComponent,
    VndAmountInputComponent
  ],
  templateUrl: './monthly-planning-page.component.html',
  styleUrl: './monthly-planning-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyPlanningPageComponent implements OnInit {
  @ViewChild('monthInput') private monthInput?: ElementRef<HTMLInputElement>;
  @ViewChild(VndAmountInputComponent) private incomeInput?: VndAmountInputComponent;

  readonly monthControl = new FormControl(currentMonthValue(), {
    nonNullable: true,
    validators: [Validators.required, monthValidator()]
  });
  readonly incomeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, incomeValidator()]
  });
  readonly form = new FormGroup({
    planMonth: this.monthControl,
    monthlyIncomeVnd: this.incomeControl
  });
  readonly defaultsState = signal<DefaultsState>('loading');
  readonly defaultJars = signal<DefaultJarsResponse | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly planRoute = signal<string | null>(null);

  private readonly api = inject(BudgetPlanApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private submitted = false;

  ngOnInit(): void {
    this.loadDefaults();
  }

  get monthErrorMessage(): string | null {
    if (!this.submitted && !this.monthControl.touched) {
      return null;
    }
    if (this.monthControl.hasError('required')) {
      return 'Select a month for this plan.';
    }
    return this.monthControl.hasError('invalidMonth') ? 'Select a valid month and year.' : null;
  }

  get incomeErrorMessage(): string | null {
    if (!this.submitted && !this.incomeControl.touched) {
      return null;
    }
    if (this.incomeControl.hasError('required')) {
      return 'Enter a monthly income.';
    }
    if (this.incomeControl.hasError('digitsOnly')) {
      return 'Use digits only; periods are added automatically.';
    }
    if (this.incomeControl.hasError('positive')) {
      return 'Income must be greater than zero.';
    }
    return this.incomeControl.hasError('maximum')
      ? 'Income exceeds the maximum supported amount.'
      : null;
  }

  loadDefaults(): void {
    this.defaultsState.set('loading');
    this.defaultJars.set(null);
    this.api.getDefaultJars()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: defaults => {
          this.defaultJars.set(defaults);
          this.defaultsState.set('ready');
        },
        error: () => this.defaultsState.set('error')
      });
  }

  submit(): void {
    this.submitted = true;
    this.submitError.set(null);
    this.planRoute.set(null);

    if (this.defaultsState() !== 'ready' || this.isSubmitting()) {
      return;
    }
    if (this.monthControl.invalid || this.incomeControl.invalid) {
      this.monthControl.markAsTouched();
      this.incomeControl.markAsTouched();
      this.focusFirstInvalidControl();
      return;
    }

    const [yearText, monthText] = this.monthControl.value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const monthlyIncomeVnd = this.incomeControl.value;
    this.isSubmitting.set(true);

    this.api.createMonthlyPlan({ year, month, monthlyIncomeVnd })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: plan => {
          this.isSubmitting.set(false);
          if (plan.year !== year || plan.month !== month) {
            this.planRoute.set(`/monthly-plans/${plan.year}/${plan.month}`);
            this.submitError.set('The server returned a plan for a different month. Please check the saved plan before trying again.');
            return;
          }
          const route = `/monthly-plans/${plan.year}/${plan.month}`;
          this.planRoute.set(route);
          void this.router.navigate(['/monthly-plans', plan.year, plan.month]).then(
            navigated => {
              if (!navigated) {
                this.submitError.set('Your plan was created, but the plan page could not be opened.');
              }
            },
            () => this.submitError.set('Your plan was created, but the plan page could not be opened.')
          );
        },
        error: error => {
          this.isSubmitting.set(false);
          this.submitError.set(this.creationErrorMessage(error));
          this.planRoute.set(`/monthly-plans/${year}/${month}`);
        }
      });
  }

  private focusFirstInvalidControl(): void {
    if (this.monthControl.invalid) {
      this.monthInput?.nativeElement.focus();
      return;
    }
    if (this.incomeControl.invalid) {
      this.incomeInput?.focus();
    }
  }

  private creationErrorMessage(error: unknown): string {
    if (error instanceof InvalidBudgetPlanResponseError) {
      return 'The server response could not be verified. Check this month’s plan before trying again.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409 || apiErrorCode(error.error) === 'MONTHLY_PLAN_ALREADY_EXISTS') {
        return 'A plan already exists for this month. No second plan was created.';
      }
      if (error.status === 400 || apiErrorCode(error.error) === 'VALIDATION_ERROR') {
        return 'The server rejected the selected month or income. Check the form and try again.';
      }
    }
    return 'We could not confirm whether your plan was created. Check this month’s plan before trying again.';
  }
}
