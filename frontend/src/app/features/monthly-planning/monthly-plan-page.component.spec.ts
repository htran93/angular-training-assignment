import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { BudgetPlanApiService } from './data-access/budget-plan-api.service';
import { MonthlyPlanPageComponent } from './monthly-plan-page.component';
import { DefaultJarsResponse, MonthlyPlanResponse } from './models/budget-plan.models';

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

describe('MonthlyPlanPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MonthlyPlanPageComponent],
      providers: [
        BudgetPlanApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ year: '2026', month: '9' })) }
        }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders only the backend income and seven returned jar budgets', () => {
    const fixture = TestBed.createComponent(MonthlyPlanPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush(monthlyPlanResponse);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('25,000,000 VND');
    expect(fixture.nativeElement.querySelectorAll('.ff-jar-card')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('8,750,000 VND');
    expect(fixture.nativeElement.textContent).not.toContain('Spent');
    expect(fixture.nativeElement.textContent).not.toContain('Remaining');
  });

  it('shows a not-found state and a create-plan link when no saved plan exists', () => {
    const fixture = TestBed.createComponent(MonthlyPlanPageComponent);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush(
      { code: 'MONTHLY_PLAN_NOT_FOUND', message: 'No monthly plan exists.', errors: [] },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No plan for this month');
    expect(fixture.nativeElement.querySelectorAll('.ff-jar-card')).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('a[routerLink="/monthly-planning"]')).not.toBeNull();
  });
});
