'use client';

import { useState } from 'react';
import { Subtask } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, CheckSquare2, Square } from 'lucide-react';

interface SubtaskListProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

export default function SubtaskList({ subtasks, onChange }: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const addSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (trimmed) {
      onChange([
        ...subtasks,
        {
          id: generateId(),
          title: trimmed,
          completed: false,
        },
      ]);
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtask = (id: string) => {
    onChange(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const deleteSubtask = (id: string) => {
    onChange(subtasks.filter((st) => st.id !== id));
  };

  const updateSubtaskTitle = (id: string, title: string) => {
    onChange(
      subtasks.map((st) => (st.id === id ? { ...st, title } : st))
    );
  };

  const completedCount = subtasks.filter((st) => st.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Subtasks</h3>
        {subtasks.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{subtasks.length} completed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <button
              onClick={() => toggleSubtask(subtask.id)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {subtask.completed ? (
                <CheckSquare2 size={20} className="text-green-500" />
              ) : (
                <Square size={20} />
              )}
            </button>
            <input
              type="text"
              value={subtask.title}
              onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
              className={`flex-1 bg-transparent border-none outline-none text-sm ${
                subtask.completed
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            />
            <button
              onClick={() => deleteSubtask(subtask.id)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubtask();
            }
          }}
          placeholder="Add a subtask..."
          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <button
          onClick={addSubtask}
          disabled={!newSubtaskTitle.trim()}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
