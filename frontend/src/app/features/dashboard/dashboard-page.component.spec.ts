import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DashboardApiService } from './data-access/dashboard-api.service';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardPeriod, MonthlyDashboardResponse } from './models/dashboard.models';

function createDashboardResponse(year: number, month: number): MonthlyDashboardResponse {
  const jars = [
    { jarType: 'livingExpenses', jarName: 'Living Expenses', percentage: 35, plannedBudgetVnd: '3500000' },
    { jarType: 'food', jarName: 'Food', percentage: 20, plannedBudgetVnd: '2000000' },
    { jarType: 'children', jarName: 'Children', percentage: 10, plannedBudgetVnd: '1000000' },
    { jarType: 'emergencyFund', jarName: 'Emergency Fund', percentage: 10, plannedBudgetVnd: '1000000' },
    { jarType: 'savings', jarName: 'Savings', percentage: 10, plannedBudgetVnd: '1000000' },
    { jarType: 'investment', jarName: 'Investment', percentage: 10, plannedBudgetVnd: '1000000' },
    { jarType: 'entertainmentAndTravel', jarName: 'Entertainment & Travel', percentage: 5, plannedBudgetVnd: '500000' }
  ] as const;

  return {
    year,
    month,
    currency: 'VND',
    monthlyIncomeVnd: '10000000',
    totalSpentVnd: '0',
    remainingVnd: '10000000',
    percentageUsed: 0,
    jars: jars.map(jar => ({
      ...jar,
      spentBudgetVnd: '0',
      remainingVnd: jar.plannedBudgetVnd,
      percentageUsed: 0
    })),
    recentExpenses: [{
      id: 21,
      expenseDate: `${year}-${String(month).padStart(2, '0')}-15`,
      description: 'Market groceries',
      jarType: 'food',
      jarName: 'Food',
      amountVnd: '125000'
    }]
  };
}

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let availablePeriods: DashboardPeriod[];
  let dashboardError: unknown;
  let periodError: unknown;
  let dashboardFactory: (year: number, month: number) => MonthlyDashboardResponse;
  let requestedDashboardPeriods: DashboardPeriod[];

  beforeEach(() => {
    availablePeriods = [
      { year: 2026, month: 10 },
      { year: 2026, month: 9 },
      { year: 2025, month: 12 }
    ];
    dashboardError = null;
    periodError = null;
    dashboardFactory = createDashboardResponse;
    requestedDashboardPeriods = [];

    const api: Pick<DashboardApiService, 'getPlanPeriods' | 'getMonthlyDashboard'> = {
      getPlanPeriods: (): Observable<DashboardPeriod[]> =>
        periodError === null ? of(availablePeriods) : throwError(() => periodError),
      getMonthlyDashboard: (year, month): Observable<MonthlyDashboardResponse> => {
        requestedDashboardPeriods.push({ year, month });
        return dashboardError === null
          ? of(dashboardFactory(year, month))
          : throwError(() => dashboardError);
      }
    };

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: DashboardApiService, useValue: api },
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(DashboardPageComponent);
  });

  afterEach(() => fixture.destroy());

  function render(): void {
    fixture.detectChanges();
  }

  it('selects the most recent plan and displays all seven jars and recent activity', () => {
    render();

    const select = fixture.nativeElement.querySelector('select#dashboard-month') as HTMLSelectElement;
    expect(select.value).toBe('2026-10');
    expect(requestedDashboardPeriods).toEqual([{ year: 2026, month: 10 }]);
    expect(fixture.nativeElement.querySelectorAll('.f5-legend__row')).toHaveLength(7);
    expect(fixture.nativeElement.querySelectorAll('.f5-jar-progress-row')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('Market groceries');
    expect(fixture.nativeElement.querySelector('time[datetime="2026-10-15"]')?.textContent?.trim())
      .toBe('Oct 15, 2026');
    expect(fixture.nativeElement.textContent).toContain('10,000,000 VND');
  });

  it('loads the selected plan when the month selector changes', () => {
    render();

    const select = fixture.nativeElement.querySelector('select#dashboard-month') as HTMLSelectElement;
    select.value = '2026-09';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(requestedDashboardPeriods).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 9 }
    ]);
    expect(fixture.componentInstance.dashboard()?.month).toBe(9);
    expect(fixture.nativeElement.textContent).toContain('September 2026');
  });

  it('shows zero spending and zero per-jar progress when no expenses exist', () => {
    dashboardFactory = (year, month) => {
      const response = createDashboardResponse(year, month);
      response.monthlyIncomeVnd = '11';
      const minimumJarBudgets = ['4', '2', '1', '1', '1', '1', '1'];
      response.jars = response.jars.map((jar, index) => ({
        ...jar,
        plannedBudgetVnd: minimumJarBudgets[index],
        remainingVnd: minimumJarBudgets[index]
      }));
      response.recentExpenses = [];
      return response;
    };

    render();

    expect(fixture.componentInstance.dashboard()?.totalSpentVnd).toBe('0');
    expect(fixture.nativeElement.textContent).toContain('No recent expenses for this plan.');
    expect(fixture.nativeElement.querySelectorAll('[role="progressbar"]')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('0 VND');
  });

  it('displays backend over-budget balances and percentages without a warning label', () => {
    dashboardFactory = (year, month) => {
      const response = createDashboardResponse(year, month);
      response.totalSpentVnd = '2500000';
      response.remainingVnd = '7500000';
      response.percentageUsed = 25;
      response.jars[1] = {
        ...response.jars[1],
        spentBudgetVnd: '2500000',
        remainingVnd: '-500000',
        percentageUsed: 125
      };
      return response;
    };

    render();

    const foodProgress = fixture.nativeElement.querySelector(
      '.f5-jar-progress-row app-progress-bar .ff-progress[aria-valuetext="125%"]'
    );
    expect(foodProgress).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('125%');
    expect(fixture.nativeElement.textContent).toContain('-500,000 VND');
    expect(fixture.nativeElement.textContent).not.toContain('Over budget');
  });

  it('shows an empty state without requesting dashboard data when no plan exists', () => {
    availablePeriods = [];
    render();

    expect(fixture.componentInstance.pageState()).toBe('no-plans');
    expect(requestedDashboardPeriods).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No monthly plans yet');
    expect(fixture.nativeElement.querySelector('a[routerLink="/monthly-planning"]')).not.toBeNull();
  });

  it('shows a missing-plan state when the selected month is no longer available', () => {
    dashboardError = new HttpErrorResponse({
      status: 404,
      error: { code: 'MONTHLY_PLAN_NOT_FOUND' }
    });
    render();

    expect(fixture.componentInstance.pageState()).toBe('missing-plan');
    expect(fixture.nativeElement.textContent).toContain('This plan is no longer available.');
  });

  it('shows a general error for a 404 that is not a missing-plan response', () => {
    dashboardError = new HttpErrorResponse({
      status: 404,
      error: { code: 'ENDPOINT_NOT_FOUND' }
    });
    render();

    expect(fixture.componentInstance.pageState()).toBe('error');
    expect(fixture.nativeElement.textContent).toContain('Dashboard unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('Monthly plan unavailable');
  });
});
