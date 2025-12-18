import { 
  CheckSquare, 
  Activity, 
  KeyRound, 
  Film,
  LucideIcon 
} from 'lucide-react';

/**
 * Navigation configuration for the app
 * This configuration makes it easy to add new functions without modifying components
 * Simply add a new entry to the NAVIGATION_ITEMS array
 */
export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: LucideIcon;
  order: number;
  category?: string; // For future grouping when many functions exist
  badge?: string; // For notifications, counts, etc.
  description?: string; // For tooltips, accessibility
}

/**
 * Central navigation configuration
 * Add new functions by adding entries to this array
 * Order items by setting the order property (lower numbers appear first)
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    route: '/fitness',
    icon: Activity,
    order: 1,
    description: 'Fitness & Nutrition tracking',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    route: '/tasks',
    icon: CheckSquare,
    order: 2,
    description: 'Task management & Kanban board',
  },
  {
    id: 'movies',
    label: 'Movies',
    route: '/movies',
    icon: Film,
    order: 3,
    description: 'Movies & TV shows tracking',
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    route: '/api-keys',
    icon: KeyRound,
    order: 4,
    description: 'API Keys Vault',
  },
];

/**
 * Get navigation items sorted by order
 */
export function getNavigationItems(): NavigationItem[] {
  return [...NAVIGATION_ITEMS].sort((a, b) => a.order - b.order);
}

/**
 * Get navigation item by route
 */
export function getNavigationItemByRoute(route: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find(item => item.route === route);
}

/**
 * Get navigation item by id
 */
export function getNavigationItemById(id: string): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find(item => item.id === id);
}

