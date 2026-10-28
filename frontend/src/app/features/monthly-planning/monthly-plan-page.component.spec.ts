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

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Month Budget Summary');
    expect(fixture.nativeElement.textContent).toContain('25,000,000 VND');
    expect(fixture.nativeElement.querySelectorAll('.ff-jar-card')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('8,750,000 VND');
    expect(fixture.nativeElement.querySelectorAll('.ff-jar-card__amount > span')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain('Spent');
    expect(fixture.nativeElement.textContent).not.toContain('Remaining');
    const segments = Array.from(
      fixture.nativeElement.querySelectorAll('.monthly-plan-page__donut-segment') as NodeListOf<SVGCircleElement>
    );
    expect(segments.map(segment => segment.getAttribute('data-jar-type'))).toEqual([
      'livingExpenses',
      'food',
      'children',
      'emergencyFund',
      'savings',
      'investment',
      'entertainmentAndTravel'
    ]);
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('.monthly-plan-page__legend-name') as NodeListOf<HTMLElement>)
        .map(name => name.textContent?.trim())
    ).toEqual([
      'Living Expenses',
      'Food',
      'Children',
      'Emergency Fund',
      'Savings',
      'Investment',
      'Entertainment & Travel'
    ]);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.monthly-plan-page__legend-percentage') as NodeListOf<HTMLElement>
      ).map(percentage => percentage.textContent?.trim())
    ).toEqual(['35%', '20%', '10%', '10%', '10%', '10%', '5%']);
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('.monthly-plan-page__share-fill') as NodeListOf<HTMLElement>)
        .map(fill => fill.style.width)
    ).toEqual(['35%', '20%', '10%', '10%', '10%', '10%', '5%']);
    const jarCards = Array.from(fixture.nativeElement.querySelectorAll('.ff-jar-card') as NodeListOf<HTMLElement>);
    expect(jarCards.every(card => card.querySelector('.monthly-plan-page__share-track') !== null)).toBe(true);
    expect((fixture.nativeElement.querySelector('.monthly-plan-page__donut') as HTMLElement).getAttribute('aria-label'))
      .toBe('100 percent allocated across seven jars');
  });

  it('renders API budget amounts without recalculating them from income or rates', () => {
    const fixture = TestBed.createComponent(MonthlyPlanPageComponent);
    fixture.detectChanges();
    const responseWithDistinctBudgets = {
      ...monthlyPlanResponse,
      monthlyIncomeVnd: '100',
      jars: monthlyPlanResponse.jars.map((jar, index) => ({ ...jar, budgetVnd: String(index + 1) }))
    };
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 9)).flush(responseWithDistinctBudgets);
    fixture.detectChanges();

    const displayedBudgets = Array.from(
      fixture.nativeElement.querySelectorAll('.ff-jar-card__amount strong') as NodeListOf<HTMLElement>
    ).map(amount => amount.textContent?.trim());

    expect(displayedBudgets).toEqual(['1 VND', '2 VND', '3 VND', '4 VND', '5 VND', '6 VND', '7 VND']);
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
