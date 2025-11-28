/**
 * Custom event system for sync notifications
 * This allows components to refresh data after sync
 */

const SYNC_EVENT = 'data-synced';

export interface SyncEventDetail {
  type: 'kanban' | 'fitness' | 'both';
  success: boolean;
}

/**
 * Dispatch a sync event to notify components
 */
export function dispatchSyncEvent(detail: SyncEventDetail): void {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent(SYNC_EVENT, { detail });
  window.dispatchEvent(event);
}

/**
 * Listen for sync events
 */
export function onSyncEvent(callback: (detail: SyncEventDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<SyncEventDetail>;
    callback(customEvent.detail);
  };
  
  window.addEventListener(SYNC_EVENT, handler);
  
  return () => {
    window.removeEventListener(SYNC_EVENT, handler);
  };
}

