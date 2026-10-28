import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NavigationItem } from '../../models/navigation-item';

export const DEFAULT_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: 'Home', route: '/dashboard', icon: 'home' },
  { label: 'Planning', route: '/monthly-planning', icon: 'planning' },
  { label: 'Add Expense', route: '/expenses/new', icon: 'expense' }
];

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppShellComponent {
  @Input() brandName = 'Family Finance';
  @Input() familyName = 'Family Name';
  @Input() familyInitials = 'FN';
  @Input() headerContext = '';
  @Input() homeRoute = '/dashboard';
  @Input() navigationItems: readonly NavigationItem[] = DEFAULT_NAVIGATION_ITEMS;
}
