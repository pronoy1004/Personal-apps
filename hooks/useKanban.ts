'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Column, Priority } from '@/lib/types';
import { loadKanbanData, loadKanbanDataAsync, saveKanbanData } from '@/lib/storage';
import { generateId, createActivityEntry } from '@/lib/utils';
import type { KanbanData } from '@/lib/types';
import { TaskTemplate } from '@/lib/templates';

export function useKanban() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try async load first (with API sync), fallback to sync localStorage
    loadKanbanDataAsync()
      .then((loaded) => {
        setData(loaded);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to localStorage on error
        const loaded = loadKanbanData();
        setData(loaded);
        setIsLoading(false);
      });
  }, []);

  const updateData = useCallback((updater: (prev: KanbanData) => KanbanData) => {
    setData((prev) => {
      if (!prev) {
        // If data is null, load it first
        const loaded = loadKanbanData();
        const updated = updater(loaded);
        saveKanbanData(updated);
        return updated;
      }
      const updated = updater(prev);
      saveKanbanData(updated);
      return updated;
    });
  }, []);

  const createTask = useCallback((title: string, status: string = 'todo') => {
    let createdTask: Task | null = null;
    
    updateData((prev) => {
      if (!prev) return prev;
      
      const newTask: Task = {
        id: generateId(),
        title,
        status,
        priority: prev.settings.defaultPriority,
        tags: [],
        subtasks: [],
        attachments: [],
        timeTracked: 0,
        timeEntries: [],
        activityLog: [createActivityEntry('created', `Task "${title}" created`)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdTask = newTask;
      
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });

    return createdTask;
  }, [updateData]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== id) return task;
        
        const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
        
        // Add activity log entry
        const activity = createActivityEntry('edited', updates.title ? `Task title changed to "${updates.title}"` : 'Task updated');
        updated.activityLog = [...task.activityLog, activity];
        
        return updated;
      }),
    }));
  }, [updateData]);

  const deleteTask = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  }, [updateData]);

  const moveTask = useCallback((taskId: string, newStatus: string, newIndex?: number) => {
    updateData((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      const oldStatus = task.status;
      
      // Remove from old position
      let tasks = prev.tasks.filter((t) => t.id !== taskId);
      
      // Update task status
      const updatedTask = {
        ...task,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        activityLog: [
          ...task.activityLog,
          createActivityEntry('moved', `Moved from "${oldStatus}" to "${newStatus}"`, oldStatus, newStatus),
        ],
      };

      // Insert at new position if specified
      if (newIndex !== undefined) {
        const statusTasks = tasks.filter((t) => t.status === newStatus);
        const otherTasks = tasks.filter((t) => t.status !== newStatus);
        statusTasks.splice(newIndex, 0, updatedTask);
        tasks = [...otherTasks, ...statusTasks];
      } else {
        tasks.push(updatedTask);
      }

      return {
        ...prev,
        tasks,
      };
    });
  }, [updateData]);

  const addColumn = useCallback((name: string, color?: string) => {
    let createdColumn: Column | null = null;

    updateData((prev) => {
      if (!prev) return prev;
      
      const newColumn: Column = {
        id: generateId(),
        name,
        color,
        order: prev.columns.length,
        createdAt: new Date().toISOString(),
      };

      createdColumn = newColumn;

      return {
        ...prev,
        columns: [...prev.columns, newColumn].sort((a, b) => a.order - b.order),
      };
    });

    return createdColumn;
  }, [updateData]);

  const updateColumn = useCallback((id: string, updates: Partial<Column>) => {
    updateData((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => (col.id === id ? { ...col, ...updates } : col)),
    }));
  }, [updateData]);

  const deleteColumn = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== id),
      // Move tasks from deleted column to first column or delete them
      tasks: prev.tasks.map((task) => {
        if (task.status === id) {
          const firstColumn = prev.columns.find((c) => c.id !== id);
          return {
            ...task,
            status: firstColumn?.id || prev.columns[0]?.id || 'todo',
          };
        }
        return task;
      }).filter((task) => {
        // Keep tasks that still have a valid status
        return prev.columns.some((col) => col.id === task.status);
      }),
    }));
  }, [updateData]);

  const archiveTask = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            archivedAt: new Date().toISOString(),
            activityLog: [
              ...task.activityLog,
              createActivityEntry('archived', 'Task archived'),
            ],
          };
        }
        return task;
      }),
    }));
  }, [updateData]);

  const restoreTask = useCallback((id: string) => {
    updateData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            archivedAt: undefined,
            activityLog: [
              ...task.activityLog,
              createActivityEntry('restored', 'Task restored'),
            ],
          };
        }
        return task;
      }),
    }));
  }, [updateData]);

  const duplicateTask = useCallback((id: string) => {
    if (!data) return;
    
    const task = data.tasks.find((t) => t.id === id);
    if (!task) return;

    const duplicatedTask: Task = {
      ...task,
      id: generateId(),
      title: `${task.title} (Copy)`,
      status: task.status,
      subtasks: task.subtasks.map((st) => ({ ...st, id: generateId() })),
      attachments: [], // Don't duplicate attachments
      timeTracked: 0,
      timeEntries: [],
      activityLog: [createActivityEntry('created', `Task "${task.title} (Copy)" duplicated`)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: undefined,
    };

    updateData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, duplicatedTask],
    }));

    return duplicatedTask;
  }, [data, updateData]);

  const createTaskFromTemplate = useCallback((template: TaskTemplate, status: string = 'todo') => {
    let createdTask: Task | null = null;
    
    updateData((prev) => {
      if (!prev) return prev;
      
      const newTask: Task = {
        id: generateId(),
        title: template.task.title || 'Untitled Task',
        description: template.task.description || '',
        status,
        priority: template.task.priority || prev.settings.defaultPriority,
        tags: template.task.tags || [],
        subtasks: (template.task.subtasks || []).map((st) => ({
          ...st,
          id: generateId(),
        })),
        attachments: [],
        timeTracked: 0,
        timeEntries: [],
        activityLog: [createActivityEntry('created', `Task "${template.task.title || 'Untitled Task'}" created from template "${template.name}"`)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: template.task.color,
      };

      createdTask = newTask;
      
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });

    return createdTask;
  }, [updateData]);

  return {
    data,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
    updateColumn,
    deleteColumn,
    archiveTask,
    restoreTask,
    duplicateTask,
    createTaskFromTemplate,
    updateData,
  };
}
