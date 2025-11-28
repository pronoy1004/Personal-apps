import type { KanbanData, FitnessData } from './types';
import { loadKanbanData, loadFitnessData, saveKanbanData, saveFitnessData } from './storage';
import * as kanbanAPI from './api/kanban';
import * as fitnessAPI from './api/fitness';

const MIGRATION_FLAG_KEY = 'data-migrated-to-cloud';

/**
 * Check if data has already been migrated
 */
export function isMigrated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * Mark data as migrated
 */
function markAsMigrated(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

/**
 * Migrate localStorage data to MongoDB via API
 */
export async function migrateDataToCloud(): Promise<{
  kanban: boolean;
  fitness: boolean;
  error?: string;
}> {
  const result = { kanban: false, fitness: false };

  try {
    // Check if online
    if (!navigator.onLine) {
      throw new Error('Cannot migrate: device is offline');
    }

    // Migrate Kanban data
    try {
      const kanbanData = loadKanbanData();
      // Only migrate if there's actual data
      if (kanbanData.tasks.length > 0 || kanbanData.columns.length > 0) {
        await kanbanAPI.saveKanbanData(kanbanData);
        result.kanban = true;
      }
    } catch (error) {
      console.error('Error migrating kanban data:', error);
    }

    // Migrate Fitness data
    try {
      const fitnessData = loadFitnessData();
      // Only migrate if there's actual data
      if (
        fitnessData.weightEntries.length > 0 ||
        fitnessData.foodEntries.length > 0 ||
        fitnessData.workoutEntries.length > 0 ||
        fitnessData.favoriteFoods.length > 0
      ) {
        await fitnessAPI.saveFitnessData(fitnessData);
        result.fitness = true;
      }
    } catch (error) {
      console.error('Error migrating fitness data:', error);
    }

    // Mark as migrated if at least one succeeded
    if (result.kanban || result.fitness) {
      markAsMigrated();
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Migration failed';
    return {
      ...result,
      error: errorMessage,
    };
  }
}

/**
 * Check if migration is needed and prompt user
 */
export function shouldMigrate(): boolean {
  if (isMigrated()) return false;
  if (typeof window === 'undefined') return false;

  // Check if there's any localStorage data to migrate
  const kanbanData = loadKanbanData();
  const fitnessData = loadFitnessData();

  const hasKanbanData = kanbanData.tasks.length > 0 || kanbanData.columns.length > 0;
  const hasFitnessData =
    fitnessData.weightEntries.length > 0 ||
    fitnessData.foodEntries.length > 0 ||
    fitnessData.workoutEntries.length > 0 ||
    fitnessData.favoriteFoods.length > 0;

  return hasKanbanData || hasFitnessData;
}

