'use client';

import { useKanban } from '@/hooks/useKanban';
import { formatDate, isDueToday } from '@/lib/utils';
import { PRIORITY_LABELS } from '@/lib/constants';
import { Task, Priority } from '@/lib/types';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function StatisticsPanel() {
  const { data } = useKanban();

  if (!data) return null;

  const activeTasks = data.tasks.filter((task) => !task.archivedAt);
  const archivedTasks = data.tasks.filter((task) => task.archivedAt);
  const completedTasks = activeTasks.filter((task) => {
    const doneColumn = data.columns.find((col) => col.name.toLowerCase() === 'done');
    return doneColumn && task.status === doneColumn.id;
  });

  const tasksByPriority = activeTasks.reduce(
    (acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    },
    {} as Record<Priority, number>
  );

  const tasksDueToday = activeTasks.filter((task) => task.dueDate && isDueToday(task.dueDate));
  const overdueTasks = activeTasks.filter((task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const totalTimeTracked = activeTasks.reduce((sum, task) => sum + task.timeTracked, 0);
  const hoursTracked = Math.floor(totalTimeTracked / 3600);
  const minutesTracked = Math.floor((totalTimeTracked % 3600) / 60);

  const completionRate =
    activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: activeTasks.length,
      icon: CheckCircle,
      color: 'blue',
    },
    {
      label: 'Completed',
      value: completedTasks.length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Due Today',
      value: tasksDueToday.length,
      icon: Calendar,
      color: 'orange',
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      icon: AlertCircle,
      color: 'red',
    },
    {
      label: 'Time Tracked',
      value: `${hoursTracked}h ${minutesTracked}m`,
      icon: Clock,
      color: 'purple',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: 'indigo',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Statistics</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={20} />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tasks by Priority */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Tasks by Priority
        </h3>
        <div className="space-y-2">
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => {
            const count = tasksByPriority[priority] || 0;
            const percentage = activeTasks.length > 0 ? (count / activeTasks.length) * 100 : 0;
            return (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {PRIORITY_LABELS[priority]}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
