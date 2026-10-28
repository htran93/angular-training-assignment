import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';
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

  it('renders a clear placeholder for each not-yet-implemented feature route', () => {
    const featureRoutes = routes.filter(route =>
      ['dashboard', 'monthly-planning', 'monthly-plans/:year/:month', 'expenses/new'].includes(route.path ?? '')
    );

    expect(featureRoutes).toHaveLength(4);
    expect(featureRoutes.every(route => route.component === RoutePlaceholderPageComponent)).toBe(true);
    expect(featureRoutes.map(route => route.data?.['pageTitle'])).toEqual([
      'Dashboard',
      'Monthly planning',
      'Monthly plan',
      'Add expense'
    ]);
  });
});
