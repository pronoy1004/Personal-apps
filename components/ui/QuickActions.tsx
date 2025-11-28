'use client';

import { useState } from 'react';
import { MoreVertical, Copy, Archive, Trash2, Edit } from 'lucide-react';

interface QuickActionsProps {
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export default function QuickActions({
  onDuplicate,
  onArchive,
  onDelete,
  onEdit,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Quick actions"
      >
        <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onEdit);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onDuplicate);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy size={16} />
                Duplicate
              </button>
            )}
            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onArchive);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Archive size={16} />
                Archive
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onDelete);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

