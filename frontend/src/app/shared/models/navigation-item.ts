export type NavigationIcon = 'home' | 'planning' | 'expense';

export interface NavigationItem {
  label: string;
  route: string;
  icon?: NavigationIcon;
}
