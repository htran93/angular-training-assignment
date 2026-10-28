import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { BudgetPlanApiService } from './data-access/budget-plan-api.service';
import { MonthlyPlanningPageComponent } from './monthly-planning-page.component';
import { DefaultJarsResponse, MonthlyPlanResponse } from './models/budget-plan.models';

@Component({
  standalone: true,
  template: ''
})
class TestPlanDestinationComponent {}

const defaultJarsResponse: DefaultJarsResponse = {
  currency: 'VND',
  totalPercentage: 100,
  jars: [
    { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, suggestedLogic: 'Housing and bills.' },
    { jarType: 'food', name: 'Food', percentage: 20, suggestedLogic: 'Groceries.' },
    { jarType: 'children', name: 'Children', percentage: 10, suggestedLogic: 'Education.' },
    { jarType: 'emergencyFund', name: 'Emergency Fund', percentage: 10, suggestedLogic: 'Unexpected costs.' },
    { jarType: 'savings', name: 'Savings', percentage: 10, suggestedLogic: 'Long-term savings.' },
    { jarType: 'investment', name: 'Investment', percentage: 10, suggestedLogic: 'Investments.' },
    { jarType: 'entertainmentAndTravel', name: 'Entertainment & Travel', percentage: 5, suggestedLogic: 'Leisure.' }
  ]
};

const monthlyPlanResponse: MonthlyPlanResponse = {
  id: 1,
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

describe('MonthlyPlanningPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MonthlyPlanningPageComponent],
      providers: [
        BudgetPlanApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'monthly-plans/:year/:month', component: TestPlanDestinationComponent }])
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the defaults and preselects the current month', () => {
    const fixture = TestBed.createComponent(MonthlyPlanningPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJarsResponse);
    fixture.detectChanges();

    const today = new Date();
    const expectedMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const monthInput = fixture.nativeElement.querySelector('#plan-month') as HTMLInputElement;

    expect(monthInput.value).toBe(expectedMonth);
    expect(fixture.nativeElement.querySelectorAll('.ff-jar-card')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('100% allocated');
  });

  it('rejects comma-grouped income without changing it or posting a plan', () => {
    const fixture = TestBed.createComponent(MonthlyPlanningPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJarsResponse);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    for (const invalidIncome of ['', '0', '-1', 'abc', '25,000,000']) {
      fixture.componentInstance.incomeControl.setValue(invalidIncome);
      fixture.detectChanges();
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      fixture.detectChanges();
      expect(submitEvent.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.incomeControl.value).toBe(invalidIncome);
      expect(fixture.componentInstance.incomeErrorMessage).not.toBeNull();
    }

    expect(http.match(BUDGET_PLAN_ENDPOINTS.PLANS)).toHaveLength(0);
  });

  it('accepts one VND as the positive lower boundary', async () => {
    const fixture = TestBed.createComponent(MonthlyPlanningPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJarsResponse);
    fixture.detectChanges();

    fixture.componentInstance.monthControl.setValue('2026-09');
    fixture.componentInstance.incomeControl.setValue('1');
    fixture.componentInstance.submit();

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(request.request.body).toEqual({ year: 2026, month: 9, monthlyIncomeVnd: '1' });
    request.flush({
      ...monthlyPlanResponse,
      monthlyIncomeVnd: '1',
      jars: [
        { jarType: 'livingExpenses', name: 'Living Expenses', percentage: 35, budgetVnd: '1' },
        { jarType: 'food', name: 'Food', percentage: 20, budgetVnd: '0' },
        { jarType: 'children', name: 'Children', percentage: 10, budgetVnd: '0' },
        { jarType: 'emergencyFund', name: 'Emergency Fund', percentage: 10, budgetVnd: '0' },
        { jarType: 'savings', name: 'Savings', percentage: 10, budgetVnd: '0' },
        { jarType: 'investment', name: 'Investment', percentage: 10, budgetVnd: '0' },
        { jarType: 'entertainmentAndTravel', name: 'Entertainment & Travel', percentage: 5, budgetVnd: '0' }
      ]
    });

    expect(fixture.componentInstance.submitError()).toBeNull();
    await fixture.whenStable();
  });

  it('preserves form values and explains an existing plan conflict', () => {
    const fixture = TestBed.createComponent(MonthlyPlanningPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJarsResponse);

    fixture.componentInstance.monthControl.setValue('2026-09');
    fixture.componentInstance.incomeControl.setValue('25000000');
    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS).flush(
      { code: 'MONTHLY_PLAN_ALREADY_EXISTS', message: 'A plan already exists.', errors: [] },
      { status: 409, statusText: 'Conflict' }
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.submitError()).toContain('A plan already exists');
    expect(fixture.componentInstance.incomeControl.value).toBe('25000000');
    expect(fixture.componentInstance.monthControl.value).toBe('2026-09');
  });

  it('posts a valid plan and navigates to the shared saved-plan route', async () => {
    const fixture = TestBed.createComponent(MonthlyPlanningPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJarsResponse);
    fixture.detectChanges();

    fixture.componentInstance.monthControl.setValue('2026-09');
    const incomeInput = fixture.nativeElement.querySelector('#monthly-income') as HTMLInputElement;
    incomeInput.value = '25000000';
    incomeInput.setSelectionRange(8, 8);
    incomeInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(incomeInput.value).toBe('25.000.000');
    expect(fixture.componentInstance.incomeControl.value).toBe('25000000');
    fixture.componentInstance.submit();

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(request.request.body).toEqual({
      year: 2026,
      month: 9,
      monthlyIncomeVnd: '25000000'
    });
    request.flush(monthlyPlanResponse);

    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/monthly-plans/2026/9');
  });
});
