import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import {
  CreateExpenseRequest,
  CreateExpenseResponse,
  parseCreateExpenseResponse
} from '../models/expense.models';

@Injectable({ providedIn: 'root' })
export class ExpenseApiService {
  private readonly http = inject(HttpClient);

  createExpense(request: CreateExpenseRequest): Observable<CreateExpenseResponse> {
    return this.http.post<unknown>(BUDGET_PLAN_ENDPOINTS.EXPENSES, request)
      .pipe(map(parseCreateExpenseResponse));
  }
}
