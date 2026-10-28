import { Routes } from '@angular/router';

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
    component: RoutePlaceholderPageComponent,
    data: { pageTitle: 'Monthly planning' }
  },
  {
    path: 'monthly-plans/:year/:month',
    component: RoutePlaceholderPageComponent,
    data: { pageTitle: 'Monthly plan' }
  },
  {
    path: 'expenses/new',
    component: RoutePlaceholderPageComponent,
    data: { pageTitle: 'Add expense' }
  },
  { path: '**', redirectTo: 'monthly-planning' }
];
