import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { BUDGET_PLAN_ENDPOINTS } from '../../../constants/api-endpoints';
import {
  DashboardPeriod,
  MonthlyDashboardResponse,
  parseDashboardPeriodsResponse,
  parseMonthlyDashboardResponse
} from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getPlanPeriods(): Observable<DashboardPeriod[]> {
    return this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.PLAN_PERIODS)
      .pipe(map(parseDashboardPeriodsResponse));
  }

  getMonthlyDashboard(year: number, month: number): Observable<MonthlyDashboardResponse> {
    return this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.DASHBOARD_BY_PERIOD(year, month))
      .pipe(map(response => parseMonthlyDashboardResponse(response, year, month)));
  }
}
