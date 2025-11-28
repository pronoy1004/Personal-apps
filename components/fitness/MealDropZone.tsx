'use client';

import { useDroppable } from '@dnd-kit/core';
import type { MealType } from '@/lib/types';

interface MealDropZoneProps {
  mealType: MealType;
  label: string;
  children: React.ReactNode;
}

export default function MealDropZone({ mealType, label, children }: MealDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `meal-${mealType}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
      }`}
    >
      {children}
    </div>
  );
}

