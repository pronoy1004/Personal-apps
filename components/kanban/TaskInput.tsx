'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Plus, FileText } from 'lucide-react';
import TaskTemplateSelector from '@/components/tasks/TaskTemplate';
import { TaskTemplate as TaskTemplateType } from '@/lib/templates';

interface TaskInputProps {
  onCreateTask: (title: string) => void;
  onCreateFromTemplate?: (template: TaskTemplateType) => void;
  defaultStatus?: string;
  openTemplatesTrigger?: number; // When changed, opens template selector
}

export default function TaskInput({ onCreateTask, onCreateFromTemplate, defaultStatus = 'todo', openTemplatesTrigger }: TaskInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open templates when trigger changes
  useEffect(() => {
    if (openTemplatesTrigger && openTemplatesTrigger > 0 && onCreateFromTemplate) {
      setShowTemplates(true);
    }
  }, [openTemplatesTrigger, onCreateFromTemplate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onCreateTask(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTemplateSelect = (template: TaskTemplateType) => {
    if (onCreateFromTemplate) {
      onCreateFromTemplate(template);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-6">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Create a new task... (Press Enter to add)"
            className="w-full px-5 sm:px-6 py-3 sm:py-4 pr-24 text-base sm:text-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-300/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 shadow-md hover:shadow-lg transition-all duration-200"
          />
          <div className="absolute right-2 sm:right-3 flex items-center gap-2">
            {onCreateFromTemplate && (
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all duration-150 shadow-sm"
                title="Use template"
              >
                <FileText size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-blue-500 shadow-sm"
            >
              <Plus size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </form>
      {showTemplates && onCreateFromTemplate && (
        <TaskTemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </>
  );
}
