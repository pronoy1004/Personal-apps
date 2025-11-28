'use client';

import { SortOption, SortDirection } from '@/lib/types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortMenuProps {
  option: SortOption;
  direction: SortDirection;
  onChange: (option: SortOption, direction: SortDirection) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'timeTracked', label: 'Time Tracked' },
];

export default function SortMenu({ option, direction, onChange }: SortMenuProps) {
  const toggleDirection = () => {
    onChange(option, direction === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={option}
        onChange={(e) => onChange(e.target.value as SortOption, direction)}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={toggleDirection}
        className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        title={direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        {direction === 'asc' ? (
          <ArrowUp size={16} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <ArrowDown size={16} className="text-gray-700 dark:text-gray-300" />
        )}
      </button>
    </div>
  );
}
