import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import { BudgetPlanApiService } from './budget-plan-api.service';
import {
  CreateMonthlyPlanRequest,
  DefaultJarsResponse,
  InvalidBudgetPlanResponseError,
  MonthlyPlanResponse
} from '../models/budget-plan.models';

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

describe('BudgetPlanApiService', () => {
  let service: BudgetPlanApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BudgetPlanApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(BudgetPlanApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and validates the seven backend-provided defaults', () => {
    let response: DefaultJarsResponse | undefined;
    service.getDefaultJars().subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS);
    expect(request.request.method).toBe('GET');
    request.flush(defaultJarsResponse);

    expect(response?.jars).toHaveLength(7);
    expect(response?.totalPercentage).toBe(100);
  });

  it('posts the selected period and digit-string income without client allocations', () => {
    const payload: CreateMonthlyPlanRequest = {
      year: 2026,
      month: 9,
      monthlyIncomeVnd: '25000000'
    };
    let response: MonthlyPlanResponse | undefined;
    service.createMonthlyPlan(payload).subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(monthlyPlanResponse);

    expect(response?.jars).toHaveLength(7);
  });

  it('loads a saved plan through the shared year/month endpoint', () => {
    let response: MonthlyPlanResponse | undefined;
    service.getMonthlyPlan(2026, 9).subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9));
    expect(request.request.method).toBe('GET');
    request.flush(monthlyPlanResponse);

    expect(response?.monthlyIncomeVnd).toBe('25000000');
  });

  it('rejects malformed defaults instead of rendering partial jar data', () => {
    let error: unknown;
    service.getDefaultJars().subscribe({ error: received => error = received });

    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush({
      currency: 'VND',
      totalPercentage: 100,
      jars: defaultJarsResponse.jars.slice(0, 6)
    });

    expect(error).toBeInstanceOf(InvalidBudgetPlanResponseError);
  });

  it('rejects an incomplete saved plan instead of exposing partial budgets', () => {
    let error: unknown;
    service.getMonthlyPlan(2026, 9).subscribe({ error: received => error = received });

    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush({
      ...monthlyPlanResponse,
      jars: monthlyPlanResponse.jars.slice(0, 6)
    });

    expect(error).toBeInstanceOf(InvalidBudgetPlanResponseError);
  });
});
