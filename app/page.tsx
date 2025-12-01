'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Task, FilterOptions, SortOption, SortDirection } from '@/lib/types';
import { useKanban } from '@/hooks/useKanban';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import TaskModal from '@/components/tasks/TaskModal';
import Header from '@/components/layout/Header';
import CommandPalette from '@/components/ui/CommandPalette';
import OnlineStatus from '@/components/ui/OnlineStatus';
import SyncStatus from '@/components/ui/SyncStatus';
import { Activity, KeyRound } from 'lucide-react';

export default function Home() {
  const { data } = useKanban();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortOption, setSortOption] = useState<SortOption>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const taskInputRef = useRef<HTMLInputElement>(null);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleSortChange = (option: SortOption, direction: SortDirection) => {
    setSortOption(option);
    setSortDirection(direction);
  };

  // Command palette keyboard shortcut (Cmd/Ctrl+P or Cmd/Ctrl+Shift+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || (e.shiftKey && e.key === 'K'))) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewTask = () => {
    // Focus the task input field
    const taskInput = document.querySelector('input[placeholder*="Create a new task"]') as HTMLInputElement;
    if (taskInput) {
      taskInput.focus();
    }
    setIsCommandPaletteOpen(false);
  };

  const handleNewTemplate = () => {
    // This would need to be passed through to KanbanBoard -> TaskInput
    // For now, just close the palette
    setIsCommandPaletteOpen(false);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading your tasks...</div>
        </div>
      </div>
    );
  }

  const availableStatuses = data.columns.map((col) => col.id);
  const availableTags = Array.from(new Set(data.tasks.flatMap((t) => t.tags)));

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="h-screen flex flex-col max-w-[1920px] mx-auto w-full">
        {/* Header */}
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filters={filters}
          onFiltersChange={setFilters}
          availableStatuses={availableStatuses}
          availableTags={availableTags}
        />

        {/* Quick Navigation */}
        <div className="px-4 sm:px-6 py-2 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex flex-wrap gap-3">
          <Link
            href="/fitness"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Activity size={18} />
            Fitness & Nutrition
          </Link>
          <Link
            href="/api-keys"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <KeyRound size={18} />
            API Keys Vault
          </Link>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            onTaskClick={handleTaskClick}
            searchValue={searchValue}
            filters={filters}
            sortOption={sortOption}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal task={selectedTask} isOpen={isModalOpen} onClose={handleCloseModal} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewTask={handleNewTask}
        onNewTemplate={handleNewTemplate}
      />

      {/* Online Status Indicator */}
      <OnlineStatus />
      
      {/* Sync Status */}
      <SyncStatus />
    </main>
  );
}
