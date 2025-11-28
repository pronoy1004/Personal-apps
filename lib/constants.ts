import { Column, Priority } from './types';

export const DEFAULT_COLUMNS: Column[] = [
  {
    id: 'todo',
    name: 'To Do',
    color: '#3b82f6',
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inProgress',
    name: 'In Progress',
    color: '#f59e0b',
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'done',
    name: 'Done',
    color: '#10b981',
    order: 2,
    createdAt: new Date().toISOString(),
  },
];

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#6b7280',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STORAGE_KEY = 'kanban-data';

export const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  autoArchiveDays: 7,
  defaultPriority: 'medium' as Priority,
  sortPreferences: {} as Record<string, { option: 'dueDate'; direction: 'asc' }>,
};
