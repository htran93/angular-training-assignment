import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { MonthlyPlanResponse } from '../monthly-planning/models/budget-plan.models';
import { AddExpensePageComponent } from './add-expense-page.component';
import { CreateExpenseResponse } from './models/expense.models';

const monthlyPlanResponse: MonthlyPlanResponse = {
  id: 8,
  year: 2026,
  month: 9,
  monthlyIncomeVnd: '25000000',
  currency: 'VND',
  createdAtUtc: '2026-09-01T00:00:00Z',
  jars: [
    { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, budgetVnd: '8750000' },
    { jarType: 'food', name: 'Food', percentage: 20, budgetVnd: '5000000' },
    { jarType: 'children', name: 'Children', percentage: 10, budgetVnd: '2500000' },
    { jarType: 'emergencyFund', name: 'Emergency Fund', percentage: 10, budgetVnd: '2500000' },
    { jarType: 'savings', name: 'Savings', percentage: 10, budgetVnd: '2500000' },
    { jarType: 'investment', name: 'Investment', percentage: 10, budgetVnd: '2500000' },
    { jarType: 'entertainmentAndTravel', name: 'Entertainment & Travel', percentage: 5, budgetVnd: '1250000' }
  ]
};

const createExpenseResponse: CreateExpenseResponse = {
  expense: {
    id: 41,
    expenseDate: '2026-09-15',
    jarType: 'food',
    jarName: 'Food',
    amountVnd: '125000',
    description: 'Market groceries',
    createdAtUtc: '2026-09-15T10:00:00Z'
  },
  jarSummary: {
    jarType: 'food',
    jarName: 'Food',
    percentage: 20,
    budgetVnd: '5000000',
    spentVnd: '725000',
    remainingVnd: '4275000'
  }
};

describe('AddExpensePageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddExpensePageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function createPage(): ComponentFixture<AddExpensePageComponent> {
    const fixture = TestBed.createComponent(AddExpensePageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function loadPlan(
    fixture: ComponentFixture<AddExpensePageComponent>,
    date = '2026-09-15'
  ): void {
    fixture.componentInstance.expenseDateControl.setValue(date);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush(monthlyPlanResponse);
    fixture.detectChanges();
  }

  function fillValidExpense(fixture: ComponentFixture<AddExpensePageComponent>): void {
    fixture.componentInstance.jarTypeControl.setValue('food');
    fixture.componentInstance.amountControl.setValue('125000');
    fixture.componentInstance.descriptionControl.setValue('Market groceries');
    fixture.detectChanges();
  }

  it('leaves the date blank until provided and loads only jars for its month', () => {
    const fixture = createPage();
    expect(fixture.componentInstance.expenseDateControl.value).toBe('');
    expect(fixture.nativeElement.querySelectorAll('.f3-expense-form__select-wrap option')).toHaveLength(1);

    loadPlan(fixture);

    const options = Array.from(fixture.nativeElement.querySelectorAll('.f3-expense-form__select-wrap option')) as HTMLOptionElement[];
    expect(options).toHaveLength(8);
    expect(options.slice(1).map(option => option.textContent?.trim())).toEqual(
      monthlyPlanResponse.jars.map(jar => `${jar.name} (${jar.percentage}%)`)
    );
    expect(fixture.componentInstance.selectedJar()).toBeNull();
  });

  it('shows a required-plan state and does not offer fallback jars', () => {
    const fixture = createPage();
    fixture.componentInstance.expenseDateControl.setValue('2026-11-03');
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(
      { code: 'MONTHLY_PLAN_NOT_FOUND', message: 'No monthly plan exists.' },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.planState()).toBe('missing');
    expect(fixture.nativeElement.textContent).toContain('Create a monthly plan before adding an expense.');
    expect(fixture.nativeElement.querySelectorAll('.f3-expense-form__select-wrap option')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('a[routerLink="/monthly-planning"]')).not.toBeNull();
  });

  it('shows a load error for a 404 that does not identify a missing plan', () => {
    const fixture = createPage();
    fixture.componentInstance.expenseDateControl.setValue('2026-11-03');
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(
      { code: 'ENDPOINT_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.planState()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain('Monthly plan unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('Monthly plan required');
  });

  it('posts the valid expense and displays backend totals including overspending', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fillValidExpense(fixture);
    fixture.componentInstance.descriptionControl.setValue('  Market groceries  ');
    fixture.componentInstance.submit();

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      expenseDate: '2026-09-15',
      jarType: 'food',
      amountVnd: '125000',
      description: 'Market groceries'
    });

    request.flush({
      ...createExpenseResponse,
      jarSummary: { ...createExpenseResponse.jarSummary, spentVnd: '6000000', remainingVnd: '-1000000' }
    }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(fixture.componentInstance.saveSuccess()).toContain('Expense saved.');
    expect(fixture.componentInstance.spendingSummary()?.spentVnd).toBe('6000000');
    expect(fixture.componentInstance.spendingSummary()?.remainingVnd).toBe('-1000000');
    expect(fixture.nativeElement.textContent).toContain('Remaining (overspent)');
    expect(fixture.nativeElement.textContent).toContain('-1,000,000 VND');
    expect(fixture.componentInstance.amountControl.value).toBe('');
    expect(fixture.componentInstance.descriptionControl.value).toBe('');
  });

  it('rejects empty, zero, signed, fractional, grouped, and out-of-range amounts', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fixture.componentInstance.jarTypeControl.setValue('food');
    fixture.componentInstance.descriptionControl.setValue('Valid description');

    for (const amount of ['', '0', '-1', '1.5', '1,000', '9223372036854775808']) {
      fixture.componentInstance.amountControl.setValue(amount);
      fixture.componentInstance.submit();
      expect(fixture.componentInstance.amountControl.invalid).toBe(true);
      expect(fixture.componentInstance.amountErrorMessage).not.toBeNull();
    }

    expect(http.match(BUDGET_PLAN_ENDPOINTS.EXPENSES)).toHaveLength(0);
    expect(fixture.componentInstance.amountControl.value).toBe('9223372036854775808');
  });

  it('accepts one VND and sends a canonical digit string', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fixture.componentInstance.jarTypeControl.setValue('food');
    fixture.componentInstance.amountControl.setValue('0001');
    fixture.componentInstance.descriptionControl.setValue('Bus fare');
    fixture.componentInstance.submit();

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES);
    expect(request.request.body).toEqual({
      expenseDate: '2026-09-15',
      jarType: 'food',
      amountVnd: '1',
      description: 'Bus fare'
    });
    request.flush({
      ...createExpenseResponse,
      expense: { ...createExpenseResponse.expense, amountVnd: '1', description: 'Bus fare' },
      jarSummary: { ...createExpenseResponse.jarSummary, spentVnd: '600001', remainingVnd: '4399999' }
    }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(fixture.componentInstance.saveSuccess()).not.toBeNull();
  });

  it('requires a selected jar and moves focus to the missing field', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fixture.componentInstance.amountControl.setValue('125000');
    fixture.componentInstance.descriptionControl.setValue('Market groceries');
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.jarTypeErrorMessage).toBe('Select a jar from this monthly plan.');
    expect(fixture.nativeElement.ownerDocument.activeElement.id).toBe('expense-jar');
    expect(http.match(BUDGET_PLAN_ENDPOINTS.EXPENSES)).toHaveLength(0);
  });

  it('accepts leap day and requests the corresponding February plan', () => {
    const fixture = createPage();
    fixture.componentInstance.expenseDateControl.setValue('2028-02-29');
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2028, 2)).flush({
      ...monthlyPlanResponse,
      year: 2028,
      month: 2
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.expenseDateControl.valid).toBe(true);
    expect(fixture.componentInstance.plan()?.year).toBe(2028);
    expect(fixture.componentInstance.plan()?.month).toBe(2);
  });

  it('maps API validation errors and preserves entered values', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fillValidExpense(fixture);
    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush({
      code: 'VALIDATION_ERROR',
      message: 'One or more fields are invalid.',
      errors: [{ field: 'description', code: 'TOO_LONG', message: 'Description is too long.' }]
    }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(fixture.componentInstance.descriptionControl.value).toBe('Market groceries');
    expect(fixture.componentInstance.descriptionErrorMessage).toBe('Description must be 500 characters or fewer.');
    expect(fixture.componentInstance.submitError()).toBeNull();
  });

  it('preserves values and avoids exposing server details when saving fails', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fillValidExpense(fixture);
    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush(
      { message: 'Sensitive database error details.' },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.amountControl.value).toBe('125000');
    expect(fixture.componentInstance.descriptionControl.value).toBe('Market groceries');
    expect(fixture.componentInstance.submitError()).toContain('could not confirm whether the expense was saved');
    expect(fixture.nativeElement.textContent).not.toContain('Sensitive database error details.');
  });

  it('keeps the loaded plan when expense creation returns an unrelated 404', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fillValidExpense(fixture);
    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush(
      { code: 'ENDPOINT_NOT_FOUND' },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.planState()).toBe('ready');
    expect(fixture.componentInstance.plan()?.month).toBe(9);
    expect(fixture.componentInstance.submitError()).toContain('could not confirm whether the expense was saved');
  });

  it('reloads the plan and requires a fresh jar selection when the API rejects membership', () => {
    const fixture = createPage();
    loadPlan(fixture);
    fillValidExpense(fixture);
    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush({
      code: 'JAR_NOT_IN_MONTHLY_PLAN',
      message: 'The selected jar is not part of this monthly plan.',
      errors: []
    }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush(monthlyPlanResponse);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedJarType()).toBeNull();
    expect(fixture.componentInstance.jarTypeErrorMessage).toContain('not part of the selected monthly plan');
    expect(fixture.componentInstance.amountControl.value).toBe('125000');
    expect(fixture.componentInstance.descriptionControl.value).toBe('Market groceries');
    expect(http.match(BUDGET_PLAN_ENDPOINTS.EXPENSES)).toHaveLength(0);
  });

  it('ignores a stale plan response after the expense date changes month', () => {
    const fixture = createPage();
    fixture.componentInstance.expenseDateControl.setValue('2026-09-15');
    fixture.detectChanges();
    const september = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9));

    fixture.componentInstance.expenseDateControl.setValue('2026-10-15');
    fixture.detectChanges();
    const october = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 10));

    september.flush(monthlyPlanResponse);
    fixture.detectChanges();
    expect(fixture.componentInstance.planState()).toBe('loading');
    expect(fixture.componentInstance.plan()).toBeNull();

    october.flush({ ...monthlyPlanResponse, month: 10 });
    fixture.detectChanges();
    expect(fixture.componentInstance.plan()?.month).toBe(10);
    expect(fixture.componentInstance.planState()).toBe('ready');
  });

  it('rejects impossible dates without loading a plan', () => {
    const fixture = createPage();
    fixture.componentInstance.expenseDateControl.setValue('2028-02-30');
    fixture.detectChanges();
    fixture.componentInstance.expenseDateControl.markAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.expenseDateErrorMessage).toBe('Enter a valid calendar date.');
    expect(fixture.componentInstance.planState()).toBe('idle');
    http.expectNone(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2028, 2));
  });
});
