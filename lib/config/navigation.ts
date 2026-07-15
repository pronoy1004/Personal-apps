import {
  Home,
  Activity,
  CheckSquare,
  Film,
  KeyRound,
  BarChart3,
  Archive,
  User,
  LucideIcon,
} from 'lucide-react';

/**
 * Navigation configuration for the hub.
 * Adding a new app = add an entry here; the chrome (bottom nav / sidebar /
 * More launcher) renders from this config.
 */
export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  order: number;
  /** 'primary' shows in the bottom nav; 'secondary' lives under "More". */
  group: 'primary' | 'secondary';
  exact?: boolean; // match route exactly (e.g. Home)
  category?: string;
  badge?: string;
  description?: string;
}

/**
 * Primary apps appear in the 5-slot bottom nav (Home + first 3 apps + More).
 * Secondary apps appear in the More launcher and the desktop sidebar.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    route: '/',
    icon: Home,
    order: 0,
    group: 'primary',
    exact: true,
    description: 'Your hub at a glance',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    route: '/fitness',
    icon: Activity,
    order: 1,
    group: 'primary',
    exact: true,
    description: 'Pro-Fit strength training & nutrition',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    route: '/tasks',
    icon: CheckSquare,
    order: 2,
    group: 'primary',
    description: 'Task management & Kanban board',
  },
  {
    id: 'movies',
    label: 'Movies',
    route: '/movies',
    icon: Film,
    order: 3,
    group: 'primary',
    description: 'Movies & TV shows tracking',
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    route: '/api-keys',
    icon: KeyRound,
    order: 4,
    group: 'secondary',
    description: 'Encrypted API keys vault',
  },
  {
    id: 'stats',
    label: 'Stats',
    route: '/stats',
    icon: BarChart3,
    order: 5,
    group: 'secondary',
    description: 'Cross-app activity & insights',
  },
  {
    id: 'archive',
    label: 'Archive',
    route: '/archive',
    icon: Archive,
    order: 6,
    group: 'secondary',
    description: 'Completed & stored items',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    route: '/me',
    icon: User,
    order: 7,
    group: 'secondary',
    description: 'Your public portfolio (/me)',
  },
];

/** All items sorted by order. */
export function getNavigationItems(): NavigationItem[] {
  return [...NAVIGATION_ITEMS].sort((a, b) => a.order - b.order);
}

/** Bottom-nav primary apps (Home, Fitness, Tasks, Movies). */
export function getPrimaryItems(): NavigationItem[] {
  return getNavigationItems().filter((i) => i.group === 'primary');
}

/** Secondary apps shown under the "More" launcher + desktop sidebar. */
export function getSecondaryItems(): NavigationItem[] {
  return getNavigationItems().filter((i) => i.group === 'secondary');
}

export function getNavigationItemByRoute(route: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.route === route);
}

export function getNavigationItemById(id: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find((item) => item.id === id);
}
