import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import { DashboardApiService } from './dashboard-api.service';
import { InvalidDashboardResponseError, MonthlyDashboardResponse } from '../models/dashboard.models';

const dashboardResponse: MonthlyDashboardResponse = {
  year: 2026,
  month: 9,
  currency: 'VND',
  monthlyIncomeVnd: '10000',
  totalSpentVnd: '0',
  remainingVnd: '10000',
  percentageUsed: 0,
  jars: [
    { jarType: 'livingExpenses', jarName: 'Living Expenses', percentage: 35, plannedBudgetVnd: '3500', spentBudgetVnd: '0', remainingVnd: '3500', percentageUsed: 0 },
    { jarType: 'food', jarName: 'Food', percentage: 20, plannedBudgetVnd: '2000', spentBudgetVnd: '0', remainingVnd: '2000', percentageUsed: 0 },
    { jarType: 'children', jarName: 'Children', percentage: 10, plannedBudgetVnd: '1000', spentBudgetVnd: '0', remainingVnd: '1000', percentageUsed: 0 },
    { jarType: 'emergencyFund', jarName: 'Emergency Fund', percentage: 10, plannedBudgetVnd: '1000', spentBudgetVnd: '0', remainingVnd: '1000', percentageUsed: 0 },
    { jarType: 'savings', jarName: 'Savings', percentage: 10, plannedBudgetVnd: '1000', spentBudgetVnd: '0', remainingVnd: '1000', percentageUsed: 0 },
    { jarType: 'investment', jarName: 'Investment', percentage: 10, plannedBudgetVnd: '1000', spentBudgetVnd: '0', remainingVnd: '1000', percentageUsed: 0 },
    { jarType: 'entertainmentAndTravel', jarName: 'Entertainment & Travel', percentage: 5, plannedBudgetVnd: '500', spentBudgetVnd: '0', remainingVnd: '500', percentageUsed: 0 }
  ],
  recentExpenses: []
};

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads available plan periods and returns them newest first', () => {
    let response: unknown;
    service.getPlanPeriods().subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLAN_PERIODS);
    expect(request.request.method).toBe('GET');
    request.flush({ periods: [{ year: 2025, month: 12 }, { year: 2026, month: 1 }] });

    expect(response).toEqual([{ year: 2026, month: 1 }, { year: 2025, month: 12 }]);
  });

  it('loads a selected month and preserves backend monetary strings', () => {
    let response: MonthlyDashboardResponse | undefined;
    service.getMonthlyDashboard(2026, 9).subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.DASHBOARD_BY_PERIOD(2026, 9));
    expect(request.request.method).toBe('GET');
    request.flush(dashboardResponse);

    expect(response?.monthlyIncomeVnd).toBe('10000');
    expect(response?.jars).toHaveLength(7);
    expect(response?.totalSpentVnd).toBe('0');
  });

  it('rejects a dashboard whose response month does not match the request', () => {
    let error: unknown;
    service.getMonthlyDashboard(2026, 8).subscribe({ error: received => error = received });

    http.expectOne(BUDGET_PLAN_ENDPOINTS.DASHBOARD_BY_PERIOD(2026, 8)).flush(dashboardResponse);

    expect(error).toBeInstanceOf(InvalidDashboardResponseError);
  });
});
