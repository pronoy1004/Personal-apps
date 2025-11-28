import { useEffect, useCallback, useRef, useState } from 'react';
import { checkSync } from '@/lib/api/sync';
import { loadKanbanDataAsync, loadFitnessDataAsync } from '@/lib/storage';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

const SYNC_INTERVAL = 30000; // 30 seconds
const SYNC_ON_FOCUS = true;
const SYNC_ON_VISIBILITY_CHANGE = true;

export function useSync(
  kanbanLastModified: string | undefined,
  fitnessLastModified: string | undefined,
  onKanbanUpdate: () => void,
  onFitnessUpdate: () => void
): SyncStatus {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setError(null);

    try {
      const result = await checkSync(kanbanLastModified, fitnessLastModified);

      if (result.kanban?.needsUpdate) {
        await loadKanbanDataAsync();
        onKanbanUpdate();
      }

      if (result.fitness?.needsUpdate) {
        await loadFitnessDataAsync();
        onFitnessUpdate();
      }

      setLastSyncTime(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      console.error('Sync error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [kanbanLastModified, fitnessLastModified, onKanbanUpdate, onFitnessUpdate, isSyncing]);

  useEffect(() => {
    // Initial sync
    performSync();

    // Set up interval sync
    syncIntervalRef.current = setInterval(() => {
      performSync();
    }, SYNC_INTERVAL);

    // Sync on window focus
    if (SYNC_ON_FOCUS) {
      const handleFocus = () => {
        performSync();
      };
      window.addEventListener('focus', handleFocus);

      // Sync on visibility change
      if (SYNC_ON_VISIBILITY_CHANGE) {
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            performSync();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          window.removeEventListener('focus', handleFocus);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
          }
        };
      }

      return () => {
        window.removeEventListener('focus', handleFocus);
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [performSync]);

  return {
    isSyncing,
    lastSyncTime,
    error,
  };
}

