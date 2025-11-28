'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType, Task } from '@/lib/types';
import TaskCard from './TaskCard';
import EmptyState from '@/components/ui/EmptyState';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDuplicateTask?: (id: string) => void;
  onArchiveTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

const Column = memo(function Column({ column, tasks, onTaskClick, onDuplicateTask, onArchiveTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div className="flex flex-col h-full flex-1 min-w-[280px]">
      {/* Column header */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-3 backdrop-blur-sm"
        style={{
          background: column.color 
            ? `linear-gradient(135deg, ${column.color}20 0%, ${column.color}10 100%)`
            : 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
          borderLeft: `4px solid ${column.color || '#6b7280'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: column.color || '#6b7280' }}
          />
          <h2 className="font-bold text-gray-900 dark:text-gray-100" style={{ fontSize: 'clamp(1rem, 1.2vw, 1.125rem)' }}>
            {column.name}
          </h2>
          <span className="font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full shadow-sm" style={{ fontSize: 'clamp(0.625rem, 0.85vw, 0.75rem)' }}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-3 rounded-xl transition-all duration-300 min-h-[200px] ${
          isOver
            ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 border-2 border-dashed border-blue-500 shadow-inner drop-zone-active ring-2 ring-blue-400/50'
            : 'bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-900/30 dark:to-gray-800/20 border-2 border-transparent'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Drag tasks here or create a new one above"
              />
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onDuplicate={onDuplicateTask ? () => onDuplicateTask(task.id) : undefined}
                  onArchive={onArchiveTask ? () => onArchiveTask(task.id) : undefined}
                  onDelete={onDeleteTask ? () => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      onDeleteTask(task.id);
                    }
                  } : undefined}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
});

export default Column;
