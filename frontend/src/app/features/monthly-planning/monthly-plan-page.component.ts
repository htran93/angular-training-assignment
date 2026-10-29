import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, catchError, map, of, switchMap, take } from 'rxjs';

import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { JarCardComponent } from '../../shared/components/jar-card/jar-card.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { StatePanelComponent } from '../../shared/components/state-panel/state-panel.component';
import { getApiErrorCode } from '../../shared/utils/api-error';
import { JarType } from '../../shared/models/jar-type';
import { VndAmountPipe } from '../../shared/pipes/vnd-amount.pipe';
import { BudgetPlanApiService } from './data-access/budget-plan-api.service';
import {
  InvalidBudgetPlanResponseError,
  MonthlyPlanResponse
} from './models/budget-plan.models';

interface PlanPeriod {
  year: number;
  month: number;
}

interface AllocationSegment {
  jarType: JarType;
  percentage: number;
  offset: number;
}

type PlanLoadResult =
  | { kind: 'success'; plan: MonthlyPlanResponse; period: PlanPeriod }
  | { kind: 'not-found' }
  | { kind: 'error' }
  | { kind: 'invalid-period' };

type PlanPageState = 'loading' | 'ready' | 'not-found' | 'error' | 'invalid-period';

function parsePlanPeriod(yearValue: string | null, monthValue: string | null): PlanPeriod | null {
  if (!yearValue || !monthValue || !/^[0-9]+$/.test(yearValue) || !/^[0-9]+$/.test(monthValue)) {
    return null;
  }
  const year = Number(yearValue);
  const month = Number(monthValue);
  return Number.isInteger(year) && year >= 1 && year <= 9999 &&
    Number.isInteger(month) && month >= 1 && month <= 12
    ? { year, month }
    : null;
}

@Component({
  selector: 'app-monthly-plan-page',
  standalone: true,
  imports: [
    AppShellComponent,
    JarCardComponent,
    MetricCardComponent,
    PanelComponent,
    RouterLink,
    StatePanelComponent,
    VndAmountPipe
  ],
  templateUrl: './monthly-plan-page.component.html',
  styleUrl: './monthly-plan-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthlyPlanPageComponent implements OnInit {
  readonly state = signal<PlanPageState>('loading');
  readonly plan = signal<MonthlyPlanResponse | null>(null);
  readonly allocationSegments = computed<AllocationSegment[]>(() => {
    let offset = 0;
    return (this.plan()?.jars ?? []).map(jar => {
      const segment = { jarType: jar.jarType, percentage: jar.percentage, offset };
      offset += jar.percentage;
      return segment;
    });
  });
  readonly period = signal<PlanPeriod | null>(null);
  readonly monthLabel = signal('');

  private readonly api = inject(BudgetPlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loadRequests = new Subject<PlanPeriod | null>();

  ngOnInit(): void {
    this.loadRequests.pipe(
      switchMap(period => period ? this.requestPlan(period) : of({ kind: 'invalid-period' as const })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => this.applyLoadResult(result));

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const period = parsePlanPeriod(params.get('year'), params.get('month'));
      this.plan.set(null);
      this.period.set(period);
      if (!period) {
        this.monthLabel.set('');
        this.loadRequests.next(null);
        return;
      }
      const monthDate = new Date(0);
      monthDate.setUTCFullYear(period.year, period.month - 1, 1);
      monthDate.setUTCHours(0, 0, 0, 0);
      this.monthLabel.set(new Intl.DateTimeFormat('en', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(monthDate));
      this.loadPlan(period);
    });
  }

  retry(): void {
    const period = this.period();
    if (period) {
      this.loadPlan(period);
    }
  }

  private loadPlan(period: PlanPeriod): void {
    this.plan.set(null);
    this.state.set('loading');
    this.loadRequests.next(period);
  }

  private requestPlan(period: PlanPeriod): Observable<PlanLoadResult> {
    return this.api.getMonthlyPlan(period.year, period.month).pipe(
      take(1),
      map(plan => plan.year === period.year && plan.month === period.month
        ? { kind: 'success', plan, period } as const
        : { kind: 'error' } as const),
      catchError((error: unknown) => of(this.classifyError(error)))
    );
  }

  private classifyError(error: unknown): PlanLoadResult {
    if (error instanceof InvalidBudgetPlanResponseError) {
      return { kind: 'error' };
    }
    if (
      error instanceof HttpErrorResponse &&
      getApiErrorCode(error.error) === 'MONTHLY_PLAN_NOT_FOUND'
    ) {
      return { kind: 'not-found' };
    }
    return { kind: 'error' };
  }

  private applyLoadResult(result: PlanLoadResult): void {
    switch (result.kind) {
      case 'success':
        this.plan.set(result.plan);
        this.state.set('ready');
        return;
      case 'not-found':
        this.state.set('not-found');
        return;
      case 'invalid-period':
        this.state.set('invalid-period');
        return;
      case 'error':
        this.state.set('error');
        return;
    }
  }
}
