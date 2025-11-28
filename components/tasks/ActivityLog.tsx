'use client';

import { ActivityEntry } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogProps {
  activities: ActivityEntry[];
}

const actionLabels: Record<ActivityEntry['action'], string> = {
  created: 'Created',
  moved: 'Moved',
  edited: 'Edited',
  completed: 'Completed',
  archived: 'Archived',
  restored: 'Restored',
  priority_changed: 'Priority changed',
  tag_added: 'Tag added',
  time_logged: 'Time logged',
};

export default function ActivityLog({ activities }: ActivityLogProps) {
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 dark:text-gray-100">
                <span className="font-medium">{actionLabels[activity.action]}</span>
                {activity.details && <span className="ml-1">{activity.details}</span>}
              </div>
              {activity.previousValue && activity.newValue && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.previousValue} → {activity.newValue}
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
