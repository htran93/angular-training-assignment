import { Routes } from '@angular/router';

import { MonthlyPlanPageComponent } from './features/monthly-planning/monthly-plan-page.component';
import { MonthlyPlanningPageComponent } from './features/monthly-planning/monthly-planning-page.component';
import { AddExpensePageComponent } from './features/expenses/add-expense-page.component';
import { RoutePlaceholderPageComponent } from './route-placeholder-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    component: RoutePlaceholderPageComponent,
    data: { pageTitle: 'Dashboard' }
  },
  {
    path: 'monthly-planning',
    component: MonthlyPlanningPageComponent,
    data: { pageTitle: 'Monthly planning' }
  },
  {
    path: 'monthly-plans/:year/:month',
    component: MonthlyPlanPageComponent,
    data: { pageTitle: 'Monthly plan' }
  },
  {
    path: 'expenses/new',
    component: AddExpensePageComponent,
    data: { pageTitle: 'Add expense' }
  },
  { path: '**', redirectTo: 'monthly-planning' }
];
