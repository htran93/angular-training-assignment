import { describe, expect, it } from 'vitest';

import {
  InvalidDashboardResponseError,
  MonthlyDashboardResponse,
  parseDashboardPeriodsResponse,
  parseMonthlyDashboardResponse
} from './dashboard.models';

const jarDefinitions = [
  { jarType: 'livingExpenses', jarName: 'Living Expenses', percentage: 35, plannedBudgetVnd: '3500' },
  { jarType: 'food', jarName: 'Food', percentage: 20, plannedBudgetVnd: '2000' },
  { jarType: 'children', jarName: 'Children', percentage: 10, plannedBudgetVnd: '1000' },
  { jarType: 'emergencyFund', jarName: 'Emergency Fund', percentage: 10, plannedBudgetVnd: '1000' },
  { jarType: 'savings', jarName: 'Savings', percentage: 10, plannedBudgetVnd: '1000' },
  { jarType: 'investment', jarName: 'Investment', percentage: 10, plannedBudgetVnd: '1000' },
  { jarType: 'entertainmentAndTravel', jarName: 'Entertainment & Travel', percentage: 5, plannedBudgetVnd: '500' }
] as const;

function createDashboardResponse(): MonthlyDashboardResponse {
  return {
    year: 2026,
    month: 9,
    currency: 'VND',
    monthlyIncomeVnd: '10000',
    totalSpentVnd: '0',
    remainingVnd: '10000',
    percentageUsed: 0,
    jars: jarDefinitions.map(jar => ({
      ...jar,
      spentBudgetVnd: '0',
      remainingVnd: jar.plannedBudgetVnd,
      percentageUsed: 0
    })),
    recentExpenses: []
  };
}

describe('dashboard response parsers', () => {
  it('orders available periods newest first and rejects duplicate periods', () => {
    expect(parseDashboardPeriodsResponse({
      periods: [
        { year: 2025, month: 12 },
        { year: 2026, month: 1 },
        { year: 2025, month: 11 }
      ]
    })).toEqual([
      { year: 2026, month: 1 },
      { year: 2025, month: 12 },
      { year: 2025, month: 11 }
    ]);

    expect(() => parseDashboardPeriodsResponse({
      periods: [{ year: 2026, month: 1 }, { year: 2026, month: 1 }]
    })).toThrow(InvalidDashboardResponseError);
  });

  it('preserves backend money strings and accepts all-zero spending values', () => {
    const response = parseMonthlyDashboardResponse(createDashboardResponse(), 2026, 9);

    expect(response.monthlyIncomeVnd).toBe('10000');
    expect(response.totalSpentVnd).toBe('0');
    expect(response.remainingVnd).toBe('10000');
    expect(response.jars).toHaveLength(7);
    expect(response.jars.every(jar => jar.spentBudgetVnd === '0' && jar.percentageUsed === 0)).toBe(true);
  });

  it('accepts backend-reported negative balances and progress above 100%', () => {
    const response = createDashboardResponse();
    response.totalSpentVnd = '3000';
    response.remainingVnd = '7000';
    response.percentageUsed = 30;
    response.jars[1] = {
      ...response.jars[1],
      spentBudgetVnd: '3000',
      remainingVnd: '-1000',
      percentageUsed: 150
    };

    const parsed = parseMonthlyDashboardResponse(response, 2026, 9);

    expect(parsed.totalSpentVnd).toBe('3000');
    expect(parsed.jars[1].remainingVnd).toBe('-1000');
    expect(parsed.jars[1].percentageUsed).toBe(150);
  });

  it('keeps progress unavailable for historical zero-budget jars with spending', () => {
    const response = createDashboardResponse();
    response.totalSpentVnd = '1';
    response.remainingVnd = '9999';
    response.percentageUsed = 0.01;
    response.jars[1] = {
      ...response.jars[1],
      plannedBudgetVnd: '0',
      spentBudgetVnd: '1',
      remainingVnd: '-1',
      percentageUsed: null
    };

    const parsed = parseMonthlyDashboardResponse(response, 2026, 9);

    expect(parsed.jars[1].percentageUsed).toBeNull();
    expect(parsed.jars[1].remainingVnd).toBe('-1');
  });

  it('preserves zero progress for historical zero-budget jars without expenses', () => {
    const response = createDashboardResponse();
    response.monthlyIncomeVnd = '1';
    response.jars = response.jars.map((jar, index) => ({
      ...jar,
      plannedBudgetVnd: index === 0 ? '1' : '0',
      remainingVnd: index === 0 ? '1' : '0'
    }));

    expect(parseMonthlyDashboardResponse(response, 2026, 9).jars.every(jar => jar.percentageUsed === 0)).toBe(true);
  });

  it('rejects invalid dates, incomplete jars, and responses for another month', () => {
    const invalidDateResponse = createDashboardResponse();
    invalidDateResponse.recentExpenses = [{
      id: 1,
      expenseDate: '2026-02-29',
      description: 'Market groceries',
      jarType: 'food',
      jarName: 'Food',
      amountVnd: '100'
    }];

    expect(() => parseMonthlyDashboardResponse(invalidDateResponse, 2026, 9))
      .toThrow(InvalidDashboardResponseError);
    expect(() => parseMonthlyDashboardResponse({
      ...createDashboardResponse(),
      jars: createDashboardResponse().jars.slice(0, 6)
    }, 2026, 9)).toThrow(InvalidDashboardResponseError);
    expect(() => parseMonthlyDashboardResponse(createDashboardResponse(), 2026, 8))
      .toThrow(InvalidDashboardResponseError);
  });
});
