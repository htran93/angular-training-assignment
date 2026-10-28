import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';
import { MonthlyPlanPageComponent } from './features/monthly-planning/monthly-plan-page.component';
import { MonthlyPlanningPageComponent } from './features/monthly-planning/monthly-planning-page.component';
import { RoutePlaceholderPageComponent } from './route-placeholder-page.component';

describe('routes', () => {
  it('defines the application navigation routes', () => {
    expect(routes).toEqual([
      expect.objectContaining({ path: '', redirectTo: 'dashboard' }),
      expect.objectContaining({ path: 'dashboard' }),
      expect.objectContaining({ path: 'monthly-planning' }),
      expect.objectContaining({ path: 'monthly-plans/:year/:month' }),
      expect.objectContaining({ path: 'expenses/new' }),
      expect.objectContaining({ path: '**', redirectTo: 'monthly-planning' })
    ]);
  });

  it('uses the monthly planning pages and leaves other feature routes explicit placeholders', () => {
    const featureRoutes = routes.filter(route =>
      ['dashboard', 'monthly-planning', 'monthly-plans/:year/:month', 'expenses/new'].includes(route.path ?? '')
    );

    expect(featureRoutes).toHaveLength(4);
    expect(routes.find(route => route.path === 'monthly-planning')?.component).toBe(MonthlyPlanningPageComponent);
    expect(routes.find(route => route.path === 'monthly-plans/:year/:month')?.component).toBe(MonthlyPlanPageComponent);
    expect(routes.find(route => route.path === 'dashboard')?.component).toBe(RoutePlaceholderPageComponent);
    expect(routes.find(route => route.path === 'expenses/new')?.component).toBe(RoutePlaceholderPageComponent);
  });
});
