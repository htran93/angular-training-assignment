import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import {
  CreateExpenseRequest,
  CreateExpenseResponse,
  parseCreateExpenseResponse
} from '../../expenses/models/expense.models';
import {
  CreateMonthlyPlanRequest,
  DefaultJarsResponse,
  MonthlyPlanResponse,
  parseDefaultJarsResponse,
  parseMonthlyPlanResponse
} from '../models/budget-plan.models';

@Injectable({ providedIn: 'root' })
export class BudgetPlanApiService {
  private readonly http = inject(HttpClient);

  getDefaultJars(): Observable<DefaultJarsResponse> {
    return this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS)
      .pipe(map(parseDefaultJarsResponse));
  }

  createMonthlyPlan(request: CreateMonthlyPlanRequest): Observable<MonthlyPlanResponse> {
    return this.http.post<unknown>(BUDGET_PLAN_ENDPOINTS.PLANS, request)
      .pipe(map(parseMonthlyPlanResponse));
  }

  getMonthlyPlan(year: number, month: number): Observable<MonthlyPlanResponse> {
    return this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(year, month))
      .pipe(map(parseMonthlyPlanResponse));
  }

  createExpense(request: CreateExpenseRequest): Observable<CreateExpenseResponse> {
    return this.http.post<unknown>(BUDGET_PLAN_ENDPOINTS.EXPENSES, request)
      .pipe(map(parseCreateExpenseResponse));
  }
}
