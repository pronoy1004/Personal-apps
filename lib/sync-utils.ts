import * as kanbanAPI from './api/kanban';
import * as fitnessAPI from './api/fitness';
import { checkSync } from './api/sync';
import { loadKanbanDataAsync, loadFitnessDataAsync, saveKanbanData, saveFitnessData, getLastSyncInfo } from './storage';
import { dispatchSyncEvent } from './sync-events';
import type { KanbanData, FitnessData } from './types';

export interface SyncResult {
  success: boolean;
  kanbanSynced: boolean;
  fitnessSynced: boolean;
  error?: string;
  lastSyncTime: Date;
}

/**
 * Force sync - push local data to server and pull server data
 */
export async function forceSyncAll(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    kanbanSynced: false,
    fitnessSynced: false,
    lastSyncTime: new Date(),
  };

  try {
    // Sync kanban data
    try {
      const kanbanData = await loadKanbanDataAsync();
      await kanbanAPI.saveKanbanData(kanbanData);
      result.kanbanSynced = true;
      dispatchSyncEvent({ type: 'kanban', success: true });
    } catch (error) {
      console.error('Failed to sync kanban:', error);
      result.success = false;
      result.error = `Kanban sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      dispatchSyncEvent({ type: 'kanban', success: false });
    }

    // Sync fitness data
    try {
      const fitnessData = await loadFitnessDataAsync();
      await fitnessAPI.saveFitnessData(fitnessData);
      result.fitnessSynced = true;
      dispatchSyncEvent({ type: 'fitness', success: true });
    } catch (error) {
      console.error('Failed to sync fitness:', error);
      result.success = false;
      result.error = result.error 
        ? `${result.error}; Fitness sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `Fitness sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      dispatchSyncEvent({ type: 'fitness', success: false });
    }

    if (result.kanbanSynced && result.fitnessSynced) {
      dispatchSyncEvent({ type: 'both', success: true });
    }

    return result;
  } catch (error) {
    return {
      success: false,
      kanbanSynced: false,
      fitnessSynced: false,
      error: error instanceof Error ? error.message : 'Sync failed',
      lastSyncTime: new Date(),
    };
  }
}

/**
 * Smart sync - check if sync is needed, then sync
 */
export async function smartSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    kanbanSynced: false,
    fitnessSynced: false,
    lastSyncTime: new Date(),
  };

  try {
    const kanbanInfo = getLastSyncInfo('kanban');
    const fitnessInfo = getLastSyncInfo('fitness');

    // Check sync status
    const syncCheck = await checkSync(
      kanbanInfo.lastModified || undefined,
      fitnessInfo.lastModified || undefined
    );

    // Sync kanban if needed
    if (syncCheck.kanban?.needsUpdate) {
      try {
        await loadKanbanDataAsync();
        result.kanbanSynced = true;
      } catch (error) {
        console.error('Failed to sync kanban:', error);
      }
    } else {
      // Push local changes
      try {
        const kanbanData = await loadKanbanDataAsync();
        await kanbanAPI.saveKanbanData(kanbanData);
        result.kanbanSynced = true;
      } catch (error) {
        console.error('Failed to push kanban:', error);
      }
    }

    // Sync fitness if needed
    if (syncCheck.fitness?.needsUpdate) {
      try {
        await loadFitnessDataAsync();
        result.fitnessSynced = true;
      } catch (error) {
        console.error('Failed to sync fitness:', error);
      }
    } else {
      // Push local changes
      try {
        const fitnessData = await loadFitnessDataAsync();
        await fitnessAPI.saveFitnessData(fitnessData);
        result.fitnessSynced = true;
      } catch (error) {
        console.error('Failed to push fitness:', error);
      }
    }

    return result;
  } catch (error) {
    return {
      success: false,
      kanbanSynced: false,
      fitnessSynced: false,
      error: error instanceof Error ? error.message : 'Sync failed',
      lastSyncTime: new Date(),
    };
  }
}

/**
 * Get sync status information
 */
export function getSyncStatus(): {
  kanban: { lastSync: string | null; lastModified: string | null };
  fitness: { lastSync: string | null; lastModified: string | null };
  isOnline: boolean;
} {
  return {
    kanban: getLastSyncInfo('kanban'),
    fitness: getLastSyncInfo('fitness'),
    isOnline: typeof window !== 'undefined' && navigator.onLine,
  };
}

