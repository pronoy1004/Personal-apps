'use client';

import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { formatDate } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import { ArrowLeft, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import TaskModal from '@/components/tasks/TaskModal';
import { Task } from '@/lib/types';

export default function ArchivePage() {
  const { data, restoreTask, deleteTask } = useKanban();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const archivedTasks = data.tasks.filter((task) => task.archivedAt);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Archived Tasks
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
              {archivedTasks.length} archived
            </span>
          </div>
        </div>

        {/* Archived tasks list */}
        {archivedTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No archived tasks yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedTasks.map((task) => {
              const priorityColor = PRIORITY_COLORS[task.priority];
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg cursor-pointer transition-all border-l-4"
                  style={{ borderLeftColor: task.color || priorityColor }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${priorityColor}20`,
                        color: priorityColor,
                      }}
                    >
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreTask(task.id);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <RotateCcw size={14} />
                      Restore
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to permanently delete this task?')) {
                          deleteTask(task.id);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                      Archived {formatDate(task.archivedAt!)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal task={selectedTask} isOpen={isModalOpen} onClose={handleCloseModal} />
    </main>
  );
}
