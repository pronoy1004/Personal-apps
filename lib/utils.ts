import { Task, SortOption, SortDirection, FilterOptions, ActivityEntry } from './types';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString: string): boolean {
  try {
    const dueDate = new Date(dateString);
    const today = startOfDay(new Date());
    return isBefore(dueDate, today);
  } catch {
    return false;
  }
}

export function isDueToday(dateString: string): boolean {
  try {
    const dueDate = startOfDay(new Date(dateString));
    const today = startOfDay(new Date());
    return dueDate.getTime() === today.getTime();
  } catch {
    return false;
  }
}

export function sortTasks(tasks: Task[], option: SortOption, direction: SortDirection): Task[] {
  const sorted = [...tasks];

  switch (option) {
    case 'dueDate':
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
    case 'priority':
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      sorted.sort((a, b) => {
        const orderA = priorityOrder[a.priority];
        const orderB = priorityOrder[b.priority];
        return direction === 'asc' ? orderB - orderA : orderA - orderB;
      });
      break;
    case 'alphabetical':
      sorted.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return direction === 'asc' ? comparison : -comparison;
      });
      break;
    case 'createdAt':
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      });
      break;
    case 'timeTracked':
      sorted.sort((a, b) => {
        return direction === 'asc' ? a.timeTracked - b.timeTracked : b.timeTracked - a.timeTracked;
      });
      break;
  }

  return sorted;
}

export function filterTasks(tasks: Task[], filters: FilterOptions): Task[] {
  return tasks.filter((task) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(searchLower);
      const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false;
      const matchesTags = task.tags.some((tag) => tag.toLowerCase().includes(searchLower));
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(task.priority)) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(task.status)) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => task.tags.includes(tag))) {
        return false;
      }
    }

    // Due date range filter
    if (filters.dueDateRange) {
      if (filters.dueDateRange.from || filters.dueDateRange.to) {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        if (filters.dueDateRange.from && isBefore(taskDate, new Date(filters.dueDateRange.from))) {
          return false;
        }
        if (filters.dueDateRange.to && isAfter(taskDate, new Date(filters.dueDateRange.to))) {
          return false;
        }
      }
    }

    // Has attachments filter
    if (filters.hasAttachments !== undefined) {
      if (filters.hasAttachments && task.attachments.length === 0) {
        return false;
      }
      if (!filters.hasAttachments && task.attachments.length > 0) {
        return false;
      }
    }

    // Has subtasks filter
    if (filters.hasSubtasks !== undefined) {
      if (filters.hasSubtasks && task.subtasks.length === 0) {
        return false;
      }
      if (!filters.hasSubtasks && task.subtasks.length > 0) {
        return false;
      }
    }

    return true;
  });
}

export function createActivityEntry(
  action: ActivityEntry['action'],
  details?: string,
  previousValue?: string,
  newValue?: string
) {
  return {
    id: generateId(),
    action,
    timestamp: new Date().toISOString(),
    details,
    previousValue,
    newValue,
  };
}
