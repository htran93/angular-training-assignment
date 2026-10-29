import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { AppShellComponent } from '../../shared/components/app-shell/app-shell.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { MonthOption, MonthSelectorComponent } from '../../shared/components/month-selector/month-selector.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { StatePanelComponent } from '../../shared/components/state-panel/state-panel.component';
import { JarType } from '../../shared/models/jar-type';
import { VndAmountPipe } from '../../shared/pipes/vnd-amount.pipe';
import { getApiErrorCode } from '../../shared/utils/api-error';
import { DashboardApiService } from './data-access/dashboard-api.service';
import {
  DashboardPeriod,
  InvalidDashboardResponseError,
  MonthlyDashboardResponse
} from './models/dashboard.models';

type DashboardPageState = 'loading-periods' | 'loading-dashboard' | 'ready' | 'no-plans' | 'missing-plan' | 'error';

const jarColorTokens: Record<JarType, string> = {
  livingExpenses: 'var(--f1-jar-living)',
  food: 'var(--f1-jar-food)',
  children: 'var(--f1-jar-children)',
  emergencyFund: 'var(--f1-jar-emergency)',
  savings: 'var(--f1-jar-savings)',
  investment: 'var(--f1-jar-investment)',
  entertainmentAndTravel: 'var(--f1-jar-travel)'
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    AppShellComponent,
    DatePipe,
    MetricCardComponent,
    MonthSelectorComponent,
    PanelComponent,
    ProgressBarComponent,
    RouterLink,
    StatePanelComponent,
    VndAmountPipe
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  readonly pageState = signal<DashboardPageState>('loading-periods');
  readonly availablePeriods = signal<DashboardPeriod[]>([]);
  readonly selectedPeriod = signal<string | null>(null);
  readonly dashboard = signal<MonthlyDashboardResponse | null>(null);
  readonly errorTitle = signal('Dashboard unavailable');
  readonly errorMessage = signal('We could not load the dashboard. Try again.');
  readonly skeletonRows = [0, 1, 2, 3, 4, 5, 6];
  readonly today = new Date();
  readonly greeting = this.getGreeting(this.today.getHours());
  readonly periodOptions = computed<MonthOption[]>(() =>
    this.availablePeriods().map(period => ({
      value: this.periodKey(period),
      label: this.formatPeriod(period)
    }))
  );
  readonly selectedPeriodLabel = computed(() => {
    const selected = this.selectedPeriod();
    const period = this.availablePeriods().find(item => this.periodKey(item) === selected);
    return period ? this.formatPeriod(period) : '';
  });
  readonly allocationDonutBackground = computed(() => {
    const dashboard = this.dashboard();
    if (!dashboard) {
      return 'conic-gradient(var(--f1-grey) 0% 100%)';
    }

    let start = 0;
    const slices = dashboard.jars.map(jar => {
      const end = start + jar.percentage;
      const slice = `${jarColorTokens[jar.jarType]} ${start}% ${end}%`;
      start = end;
      return slice;
    });

    return `conic-gradient(${slices.join(', ')})`;
  });

  private readonly api = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' });
  private readonly expenseDateFormatter = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
  private readonly percentageFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  private requestVersion = 0;

  ngOnInit(): void {
    this.loadPlanPeriods();
  }

  selectPeriod(value: string | null): void {
    if (value === null) {
      return;
    }

    const period = this.availablePeriods().find(item => this.periodKey(item) === value);
    if (!period) {
      this.dashboard.set(null);
      this.errorTitle.set('Select an available plan');
      this.errorMessage.set('Choose a month that has an existing plan.');
      this.pageState.set('error');
      return;
    }

    this.selectedPeriod.set(value);
    this.loadDashboard(period);
  }

  retry(): void {
    const selected = this.selectedPeriod();
    const period = this.availablePeriods().find(item => this.periodKey(item) === selected);
    if (period) {
      this.loadDashboard(period);
      return;
    }
    this.loadPlanPeriods();
  }

  formatPercentage(value: number): string {
    return this.percentageFormatter.format(value);
  }

  formatExpenseDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return this.expenseDateFormatter.format(date);
  }

  jarColor(jarType: JarType): string {
    return jarColorTokens[jarType];
  }

  jarInitial(name: string): string {
    return name.trim().charAt(0).toLocaleUpperCase();
  }

  progressLabel(jarName: string, spentVnd: string, plannedVnd: string, percentage: number | null): string {
    const progress = percentage === null ? 'progress unavailable for zero budget' : `${this.formatPercentage(percentage)}%`;
    return `${jarName}: ${spentVnd} VND spent of ${plannedVnd} VND, ${progress}`;
  }

  percentageLabel(value: number | null): string {
    return value === null ? 'N/A' : `${this.formatPercentage(value)}%`;
  }

  private loadPlanPeriods(): void {
    const requestVersion = ++this.requestVersion;
    this.pageState.set('loading-periods');
    this.availablePeriods.set([]);
    this.selectedPeriod.set(null);
    this.dashboard.set(null);

    this.api.getPlanPeriods()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: periods => {
          if (requestVersion !== this.requestVersion) {
            return;
          }

          this.availablePeriods.set(periods);
          if (periods.length === 0) {
            this.pageState.set('no-plans');
            return;
          }

          const mostRecent = periods[0];
          this.selectedPeriod.set(this.periodKey(mostRecent));
          this.loadDashboard(mostRecent);
        },
        error: error => {
          if (requestVersion !== this.requestVersion) {
            return;
          }
          this.setErrorState(error, 'We could not load your available monthly plans. Try again.');
        }
      });
  }

  private loadDashboard(period: DashboardPeriod): void {
    const requestVersion = ++this.requestVersion;
    this.pageState.set('loading-dashboard');
    this.dashboard.set(null);

    this.api.getMonthlyDashboard(period.year, period.month)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          if (requestVersion !== this.requestVersion) {
            return;
          }
          this.dashboard.set(response);
          this.pageState.set('ready');
        },
        error: error => {
          if (requestVersion !== this.requestVersion) {
            return;
          }
          if (this.isMissingPlan(error)) {
            this.pageState.set('missing-plan');
            return;
          }
          this.setErrorState(error, 'We could not load this month’s dashboard. Try again.');
        }
      });
  }

  private setErrorState(error: unknown, fallbackMessage: string): void {
    this.dashboard.set(null);
    if (error instanceof InvalidDashboardResponseError) {
      this.errorTitle.set('Dashboard data unavailable');
      this.errorMessage.set('The dashboard response could not be verified. Try again.');
    } else {
      this.errorTitle.set('Dashboard unavailable');
      this.errorMessage.set(fallbackMessage);
    }
    this.pageState.set('error');
  }

  private isMissingPlan(error: unknown): boolean {
    return error instanceof HttpErrorResponse &&
      getApiErrorCode(error.error) === 'MONTHLY_PLAN_NOT_FOUND';
  }

  private periodKey(period: DashboardPeriod): string {
    return `${period.year}-${String(period.month).padStart(2, '0')}`;
  }

  private formatPeriod(period: DashboardPeriod): string {
    const monthName = this.monthFormatter.format(new Date(Date.UTC(2000, period.month - 1, 1)));
    return `${monthName} ${period.year}`;
  }

  private getGreeting(hour: number): string {
    if (hour < 12) {
      return 'Good morning';
    }
    return hour < 18 ? 'Good afternoon' : 'Good evening';
  }
}
