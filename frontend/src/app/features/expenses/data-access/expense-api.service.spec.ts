import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import {
  CreateExpenseRequest,
  CreateExpenseResponse,
  InvalidExpenseResponseError
} from '../models/expense.models';
import { ExpenseApiService } from './expense-api.service';

const createExpenseResponse: CreateExpenseResponse = {
  expense: {
    id: 21,
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

describe('ExpenseApiService', () => {
  let service: ExpenseApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExpenseApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ExpenseApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates an expense with the defined request fields and validates backend totals', () => {
    const requestBody: CreateExpenseRequest = {
      expenseDate: '2026-09-15',
      jarType: 'food',
      amountVnd: '125000',
      description: 'Market groceries'
    };
    let response: CreateExpenseResponse | undefined;
    service.createExpense(requestBody).subscribe(value => response = value);

    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    expect(Object.keys(request.request.body as object)).toEqual([
      'expenseDate',
      'jarType',
      'amountVnd',
      'description'
    ]);
    request.flush(createExpenseResponse, { status: 201, statusText: 'Created' });

    expect(response?.expense.id).toBe(21);
    expect(response?.jarSummary.spentVnd).toBe('725000');
    expect(response?.jarSummary.remainingVnd).toBe('4275000');
  });

  it('preserves backend-reported negative balances', () => {
    let response: CreateExpenseResponse | undefined;
    service.createExpense({
      expenseDate: '2026-09-15',
      jarType: 'food',
      amountVnd: '125000',
      description: 'Market groceries'
    }).subscribe(value => response = value);

    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush({
      ...createExpenseResponse,
      jarSummary: { ...createExpenseResponse.jarSummary, spentVnd: '6000000', remainingVnd: '-1000000' }
    }, { status: 201, statusText: 'Created' });

    expect(response?.jarSummary.remainingVnd).toBe('-1000000');
  });

  it('rejects malformed expense responses instead of exposing fabricated totals', () => {
    let error: unknown;
    service.createExpense({
      expenseDate: '2026-09-15',
      jarType: 'food',
      amountVnd: '125000',
      description: 'Market groceries'
    }).subscribe({ error: received => error = received });

    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush({
      ...createExpenseResponse,
      jarSummary: { ...createExpenseResponse.jarSummary, remainingVnd: 'invalid' }
    }, { status: 201, statusText: 'Created' });

    expect(error).toBeInstanceOf(InvalidExpenseResponseError);
  });
});
