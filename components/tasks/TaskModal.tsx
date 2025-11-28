'use client';

import { useState, useEffect } from 'react';
import { Task, Priority, TaskStatus } from '@/lib/types';
import { useKanban } from '@/hooks/useKanban';
import Modal from '@/components/ui/Modal';
import PriorityBadge from './PriorityBadge';
import SubtaskList from './SubtaskList';
import TagInput from './TagInput';
import AttachmentList from './AttachmentList';
import ActivityLog from './ActivityLog';
import TimeTracker from './TimeTracker';
import { Calendar, Trash2, Save } from 'lucide-react';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { data, updateTask, deleteTask, archiveTask, restoreTask } = useKanban();
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  if (!editedTask || !data) return null;

  const handleSave = () => {
    updateTask(editedTask.id, {
      title: editedTask.title,
      description: editedTask.description,
      priority: editedTask.priority,
      dueDate: editedTask.dueDate,
      color: editedTask.color,
      tags: editedTask.tags,
      subtasks: editedTask.subtasks,
      attachments: editedTask.attachments,
      status: editedTask.status,
      timeTracked: editedTask.timeTracked,
      timeEntries: editedTask.timeEntries,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(editedTask.id);
      onClose();
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setEditedTask({ ...editedTask, status: newStatus });
  };

  const handlePriorityChange = (newPriority: Priority) => {
    setEditedTask({ ...editedTask, priority: newPriority });
  };

  const allTags = Array.from(new Set(data.tasks.flatMap((t) => t.tags)));

  return (
    <Modal isOpen={isOpen} onClose={handleSave} title="Edit Task" size="lg">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-lg font-semibold"
            placeholder="Task title..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            placeholder="Add a description..."
          />
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={editedTask.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {data.columns
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    editedTask.priority === priority
                      ? 'ring-2 ring-blue-500'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[priority]}20`,
                    color: PRIORITY_COLORS[priority],
                  }}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date
          </label>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500 dark:text-gray-400" />
            <input
              type="date"
              value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
              onChange={(e) =>
                setEditedTask({
                  ...editedTask,
                  dueDate: e.target.value ? `${e.target.value}T00:00:00` : undefined,
                })
              }
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            {editedTask.dueDate && (
              <button
                onClick={() => setEditedTask({ ...editedTask, dueDate: undefined })}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color Label
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editedTask.color || '#3b82f6'}
              onChange={(e) => setEditedTask({ ...editedTask, color: e.target.value })}
              className="h-10 w-20 rounded-lg cursor-pointer border border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={() => setEditedTask({ ...editedTask, color: undefined })}
              className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Tags */}
        <TagInput
          tags={editedTask.tags}
          onChange={(tags) => setEditedTask({ ...editedTask, tags })}
          suggestions={allTags}
        />

        {/* Subtasks */}
        <SubtaskList
          subtasks={editedTask.subtasks}
          onChange={(subtasks) => setEditedTask({ ...editedTask, subtasks })}
        />

        {/* Attachments */}
        <AttachmentList
          attachments={editedTask.attachments}
          onChange={(attachments) => setEditedTask({ ...editedTask, attachments })}
        />

        {/* Time Tracking */}
        <TimeTracker
          timeTracked={editedTask.timeTracked}
          timeEntries={editedTask.timeEntries}
          onUpdate={(timeTracked, timeEntries) =>
            setEditedTask({ ...editedTask, timeTracked, timeEntries })
          }
        />

        {/* Activity Log */}
        <ActivityLog activities={editedTask.activityLog} />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
            {editedTask.archivedAt ? (
              <button
                onClick={() => {
                  restoreTask(editedTask.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Restore
              </button>
            ) : (
              <button
                onClick={() => {
                  archiveTask(editedTask.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Archive
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
