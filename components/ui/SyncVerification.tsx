'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Database, Calendar } from 'lucide-react';
import { forceSyncAll, getSyncStatus } from '@/lib/sync-utils';
import { formatDistanceToNow, format } from 'date-fns';
import type { KanbanData, FitnessData } from '@/lib/types';
import { loadKanbanData, loadFitnessData } from '@/lib/storage';

export default function SyncVerification() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    kanbanSynced: boolean;
    fitnessSynced: boolean;
    error?: string;
    lastSyncTime: Date;
  } | null>(null);
  
  const [syncInfo, setSyncInfo] = useState(getSyncStatus());
  const [localDataInfo, setLocalDataInfo] = useState<{
    kanban: { tasks: number; lastModified: string | null };
    fitness: { entries: number; lastModified: string | null };
  }>({
    kanban: { tasks: 0, lastModified: null },
    fitness: { entries: 0, lastModified: null },
  });

  // Update sync info
  const updateSyncInfo = () => {
    const status = getSyncStatus();
    setSyncInfo(status);

    // Get local data info
    try {
      const kanbanData: KanbanData = loadKanbanData();
      const fitnessData: FitnessData = loadFitnessData();
      
      setLocalDataInfo({
        kanban: {
          tasks: kanbanData.tasks.length,
          lastModified: kanbanData.tasks.length > 0 
            ? kanbanData.tasks[kanbanData.tasks.length - 1]?.updatedAt || null
            : null,
        },
        fitness: {
          entries: fitnessData.foodEntries.length + fitnessData.weightEntries.length + fitnessData.workoutEntries.length,
          lastModified: fitnessData.foodEntries.length > 0
            ? fitnessData.foodEntries[fitnessData.foodEntries.length - 1]?.timestamp || null
            : null,
        },
      });
    } catch (error) {
      console.error('Error loading local data info:', error);
    }
  };

  useEffect(() => {
    updateSyncInfo();
    const interval = setInterval(updateSyncInfo, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await forceSyncAll();
      setSyncResult(result);
      updateSyncInfo();
    } catch (error) {
      setSyncResult({
        success: false,
        kanbanSynced: false,
        fitnessSynced: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        lastSyncTime: new Date(),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sync Status</h3>
        <button
          onClick={handleSync}
          disabled={isSyncing || !syncInfo.isOnline}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kanban Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Database size={18} className="text-blue-500" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Kanban Data</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Local Tasks:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{localDataInfo.kanban.tasks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {syncInfo.kanban.lastSync
                  ? formatDistanceToNow(new Date(syncInfo.kanban.lastSync), { addSuffix: true })
                  : 'Never'}
              </span>
            </div>
            {syncInfo.kanban.lastModified && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Server Modified:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDistanceToNow(new Date(syncInfo.kanban.lastModified), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fitness Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} className="text-green-500" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Fitness Data</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Local Entries:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{localDataInfo.fitness.entries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {syncInfo.fitness.lastSync
                  ? formatDistanceToNow(new Date(syncInfo.fitness.lastSync), { addSuffix: true })
                  : 'Never'}
              </span>
            </div>
            {syncInfo.fitness.lastModified && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Server Modified:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDistanceToNow(new Date(syncInfo.fitness.lastModified), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div
          className={`p-4 rounded-lg border ${
            syncResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {syncResult.success ? (
              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            )}
            <span
              className={`font-semibold ${
                syncResult.success
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}
            >
              {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div
              className={
                syncResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }
            >
              Kanban: {syncResult.kanbanSynced ? '✓ Synced' : '✗ Failed'}
            </div>
            <div
              className={
                syncResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }
            >
              Fitness: {syncResult.fitnessSynced ? '✓ Synced' : '✗ Failed'}
            </div>
            {syncResult.error && (
              <div className="text-red-800 dark:text-red-300 mt-2">{syncResult.error}</div>
            )}
            <div className="text-gray-600 dark:text-gray-400 mt-2">
              Last sync: {format(syncResult.lastSyncTime, 'PPpp')}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className={`p-3 rounded-lg border ${
        syncInfo.isOnline
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center gap-2">
          {syncInfo.isOnline ? (
            <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {syncInfo.isOnline ? 'Online - Sync enabled' : 'Offline - Using local storage only'}
          </span>
        </div>
      </div>
    </div>
  );
}

