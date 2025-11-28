'use client';

import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import type { FavoriteFood } from '@/lib/types';

interface FavoriteCardProps {
  favorite: FavoriteFood;
  onRemove: (id: string) => void;
  onClick: () => void;
}

export default function FavoriteCard({ favorite, onRemove, onClick }: FavoriteCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `favorite-${favorite.id}`,
    data: {
      type: 'favorite',
      favorite,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <button
        onClick={onClick}
        className="flex-1 text-left min-w-0"
      >
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {favorite.name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {favorite.baseQuantity} {favorite.unit} • {favorite.macros.calories} cal
        </div>
      </button>
    </div>
  );
}

