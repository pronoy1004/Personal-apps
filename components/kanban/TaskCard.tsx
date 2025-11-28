'use client';

import { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, Priority } from '@/lib/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import { formatDate, isOverdue, isDueToday } from '@/lib/utils';
import { Calendar, Tag, Paperclip, CheckSquare, Clock } from 'lucide-react';
import QuickActions from '@/components/ui/QuickActions';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const TaskCard = memo(function TaskCard({ task, onClick, onDuplicate, onArchive, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const priorityColor = PRIORITY_COLORS[task.priority];
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const subtaskProgress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeftColor: task.color || priorityColor,
    willChange: isDragging ? 'transform' : 'auto',
    filter: isDragging ? 'blur(2px)' : 'none',
  };

  const mergedStyle = {
    ...style,
    padding: 'clamp(0.875rem, 1.2vw, 1.25rem)',
  };

  return (
    <div
      ref={setNodeRef}
      style={mergedStyle}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl cursor-grab active:cursor-grabbing transition-all duration-200 border-l-4 transform-gpu relative ${
        isDragging 
          ? 'ring-4 ring-blue-500/50 scale-[0.98] shadow-2xl z-50 dragging-card' 
          : 'hover:scale-[1.02] hover:shadow-lg'
      }`}
    >
      {/* Quick Actions - only show on hover */}
      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
        <QuickActions
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onDelete={onDelete}
          onEdit={onClick}
        />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 pr-8" style={{ fontSize: 'clamp(0.875rem, 1.1vw, 1rem)' }}>
        {task.title}
      </h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2" style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.875rem)' }}>
          {task.description}
        </p>
      )}

      {/* Subtasks progress */}
      {task.subtasks.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {completedSubtasks}/{task.subtasks.length} subtasks
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-3 flex-wrap mt-3">
        {/* Priority badge */}
        <span
          className="px-2 py-1 rounded-full font-medium"
          style={{
            backgroundColor: `${priorityColor}20`,
            color: priorityColor,
            fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)',
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 ${
              isOverdue(task.dueDate)
                ? 'text-red-500'
                : isDueToday(task.dueDate)
                ? 'text-orange-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)' }}
          >
            <Calendar size={12} style={{ width: 'clamp(10px, 1vw, 12px)', height: 'clamp(10px, 1vw, 12px)' }} />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)' }}>
            <Tag style={{ width: 'clamp(10px, 1vw, 12px)', height: 'clamp(10px, 1vw, 12px)' }} />
            <span>{task.tags.length}</span>
          </div>
        )}

        {/* Attachments */}
        {task.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)' }}>
            <Paperclip style={{ width: 'clamp(10px, 1vw, 12px)', height: 'clamp(10px, 1vw, 12px)' }} />
            <span>{task.attachments.length}</span>
          </div>
        )}

        {/* Time tracked */}
        {task.timeTracked > 0 && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" style={{ fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)' }}>
            <Clock style={{ width: 'clamp(10px, 1vw, 12px)', height: 'clamp(10px, 1vw, 12px)' }} />
            <span>
              {Math.floor(task.timeTracked / 3600)}h {Math.floor((task.timeTracked % 3600) / 60)}m
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskCard;
