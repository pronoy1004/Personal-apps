'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core';
import { useState } from 'react';
import { Task, Column as ColumnType, FilterOptions, SortOption, SortDirection } from '@/lib/types';
import { useKanban } from '@/hooks/useKanban';
import { filterTasks, sortTasks } from '@/lib/utils';
import Column from './Column';
import TaskCard from './TaskCard';
import TaskInput from './TaskInput';
import SortMenu from '@/components/ui/SortMenu';

interface KanbanBoardProps {
  onTaskClick: (task: Task) => void;
  searchValue: string;
  filters: FilterOptions;
  sortOption: SortOption;
  sortDirection: SortDirection;
  onSortChange: (option: SortOption, direction: SortDirection) => void;
}

export default function KanbanBoard({
  onTaskClick,
  searchValue,
  filters,
  sortOption,
  sortDirection,
  onSortChange,
}: KanbanBoardProps) {
  const { data, createTask, moveTask, duplicateTask, archiveTask, deleteTask, createTaskFromTemplate } = useKanban();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  if (!data) {
    return null;
  }

  const sortedColumns = [...data.columns].sort((a, b) => a.order - b.order);
  let activeTasks = data.tasks.filter((task) => !task.archivedAt);

  // Apply filters and search
  const filterOptions: FilterOptions = {
    ...filters,
    search: searchValue,
  };
  activeTasks = filterTasks(activeTasks, filterOptions);

  // Apply sorting (per column)
  const getSortedColumnTasks = (columnId: string) => {
    const columnTasks = activeTasks.filter((task) => task.status === columnId);
    return sortTasks(columnTasks, sortOption, sortDirection);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = activeTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a column
    const targetColumn = sortedColumns.find((col) => col.id === overId);
    if (targetColumn) {
      moveTask(taskId, targetColumn.id);
      return;
    }

    // Check if dropping on another task
    const targetTask = activeTasks.find((t) => t.id === overId);
    if (targetTask) {
      moveTask(taskId, targetTask.status);
      return;
    }
  };

  const handleCreateTask = (title: string) => {
    const firstColumn = sortedColumns[0];
    if (firstColumn) {
      createTask(title, firstColumn.id);
    }
  };

  const handleCreateFromTemplate = (template: any) => {
    const firstColumn = sortedColumns[0];
    if (firstColumn) {
      createTaskFromTemplate(template, firstColumn.id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Task input and sort */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <TaskInput onCreateTask={handleCreateTask} onCreateFromTemplate={handleCreateFromTemplate} />
        </div>
        <div className="hidden sm:block">
          <SortMenu
            option={sortOption}
            direction={sortDirection}
            onChange={onSortChange}
          />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-2 sm:px-4 md:px-6 pb-4 sm:pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent kanban-container">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 h-full w-full pb-2" style={{ gap: 'clamp(0.75rem, 1.5vw, 2rem)' }}>
            {sortedColumns.map((column) => {
              const columnTasks = getSortedColumnTasks(column.id);
              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onTaskClick={onTaskClick}
                  onDuplicateTask={duplicateTask}
                  onArchiveTask={archiveTask}
                  onDeleteTask={deleteTask}
                />
              );
            })}
          </div>
          <DragOverlay
            style={{
              transform: 'rotate(6deg) scale(1.05)',
              opacity: 0.95,
            }}
            className="drag-overlay"
          >
            {activeTask ? (
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-500 rounded-xl blur-xl opacity-50 animate-pulse" />
                <div className="relative transform transition-transform duration-200">
                  <TaskCard task={activeTask} onClick={() => {}} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
