'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getSyncStatus } from '@/lib/sync-utils';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Update last sync time when it changes
  useEffect(() => {
    const updateSyncTime = () => {
      const status = getSyncStatus();
      const lastSync = status.kanban.lastSync || status.fitness.lastSync;
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    };

    // Initial load
    updateSyncTime();

    // Listen for sync events from storage
    const handleStorageChange = () => {
      updateSyncTime();
    };
    window.addEventListener('storage', handleStorageChange);

    // Poll localStorage for changes (lightweight, only checks timestamp)
    const interval = setInterval(() => {
      updateSyncTime();
    }, 5000); // Check every 5 seconds for UI update only (no API calls)

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-lg text-sm">
        <WifiOff size={16} />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-green-500" />
          {lastSyncTime ? (
            <span className="text-gray-600 dark:text-gray-400">
              Saved {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              Ready to sync
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

