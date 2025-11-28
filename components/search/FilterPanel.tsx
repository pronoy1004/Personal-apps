'use client';

import { FilterOptions, Priority } from '@/lib/types';
import { PRIORITY_LABELS } from '@/lib/constants';
import { X } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableStatuses: string[];
  availableTags: string[];
}

export default function FilterPanel({ filters, onChange, availableStatuses, availableTags }: FilterPanelProps) {
  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    (filters.priority && filters.priority.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.hasAttachments !== undefined ||
    filters.hasSubtasks !== undefined;

  const clearFilters = () => {
    onChange({ search: filters.search });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Priority filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Priority
        </label>
        <div className="space-y-2">
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
            <label key={priority} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.priority?.includes(priority) || false}
                onChange={(e) => {
                  const current = filters.priority || [];
                  if (e.target.checked) {
                    updateFilter('priority', [...current, priority]);
                  } else {
                    updateFilter('priority', current.filter((p) => p !== priority));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {PRIORITY_LABELS[priority]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {availableStatuses.map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.status?.includes(status) || false}
                onChange={(e) => {
                  const current = filters.status || [];
                  if (e.target.checked) {
                    updateFilter('status', [...current, status]);
                  } else {
                    updateFilter('status', current.filter((s) => s !== status));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.tags?.includes(tag) || false}
                  onChange={(e) => {
                    const current = filters.tags || [];
                    if (e.target.checked) {
                      updateFilter('tags', [...current, tag]);
                    } else {
                      updateFilter('tags', current.filter((t) => t !== tag));
                    }
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Has attachments */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasAttachments === true}
            onChange={(e) => updateFilter('hasAttachments', e.target.checked ? true : undefined)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Has attachments</span>
        </label>
      </div>

      {/* Has subtasks */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasSubtasks === true}
            onChange={(e) => updateFilter('hasSubtasks', e.target.checked ? true : undefined)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Has subtasks</span>
        </label>
      </div>
    </div>
  );
}
