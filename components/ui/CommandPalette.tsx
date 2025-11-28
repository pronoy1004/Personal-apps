'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Archive, BarChart3, Settings, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTask?: () => void;
  onNewTemplate?: () => void;
}

export default function CommandPalette({ isOpen, onClose, onNewTask, onNewTemplate }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const commands: Command[] = useMemo(() => [
    {
      id: 'new-task',
      label: 'Create New Task',
      icon: <Plus size={20} />,
      action: () => {
        if (onNewTask) {
          onNewTask();
          onClose();
        }
      },
      keywords: ['new', 'task', 'create', 'add'],
    },
    {
      id: 'new-template',
      label: 'Create from Template',
      icon: <FileText size={20} />,
      action: () => {
        if (onNewTemplate) {
          onNewTemplate();
          onClose();
        }
      },
      keywords: ['template', 'from template'],
    },
    {
      id: 'stats',
      label: 'View Statistics',
      icon: <BarChart3 size={20} />,
      action: () => {
        router.push('/stats');
        onClose();
      },
      keywords: ['stats', 'statistics', 'analytics'],
    },
    {
      id: 'archive',
      label: 'View Archive',
      icon: <Archive size={20} />,
      action: () => {
        router.push('/archive');
        onClose();
      },
      keywords: ['archive', 'archived'],
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <Settings size={20} />,
      action: () => {
        // Trigger settings panel open - would need to be passed as prop or use context
        onClose();
      },
      keywords: ['settings', 'preferences', 'config'],
    },
  ], [onNewTask, onNewTemplate, router, onClose]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter((cmd) =>
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(searchLower))
    );
  }, [commands, search]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={command.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="text-gray-500 dark:text-gray-400">{command.icon}</div>
                  <span className="text-gray-900 dark:text-gray-100">{command.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>↑↓ Navigate</span>
          <span>Enter Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

