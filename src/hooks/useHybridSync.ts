import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { HybridSyncStatus, SyncQueueItem } from '../types';

export function useHybridSync() {
  const [syncStatus, setSyncStatus] = useState<HybridSyncStatus>(() => db.getHybridSyncStatus());
  const [pendingQueue, setPendingQueue] = useState<SyncQueueItem[]>(() => db.getPendingSyncQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(() => {
    setSyncStatus(db.getHybridSyncStatus());
    setPendingQueue(db.getPendingSyncQueue());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      refresh();
      // Auto sync when coming back online
      if (!db.isSimulatedOffline()) {
        db.triggerSync().then(() => refresh());
      }
    };

    const handleOffline = () => {
      refresh();
    };

    const handleSyncChange = () => {
      refresh();
    };

    const handleConnectivityChange = () => {
      refresh();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('almadar_sync_change', handleSyncChange);
    window.addEventListener('almadar_connectivity_change', handleConnectivityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('almadar_sync_change', handleSyncChange);
      window.removeEventListener('almadar_connectivity_change', handleConnectivityChange);
    };
  }, [refresh]);

  const toggleOfflineMode = useCallback(() => {
    const isNowOffline = db.toggleSimulatedOffline();
    refresh();
    return isNowOffline;
  }, [refresh]);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await db.triggerSync();
      refresh();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [refresh]);

  const clearCompleted = useCallback(() => {
    db.clearSyncedItems();
    refresh();
  }, [refresh]);

  return {
    isOnline: syncStatus.isOnline,
    isSimulatedOffline: syncStatus.isSimulatedOffline,
    pendingCount: syncStatus.pendingCount,
    lastSyncTime: syncStatus.lastSyncTime,
    totalLocalRecords: syncStatus.totalLocalRecords,
    pendingQueue,
    isSyncing,
    toggleOfflineMode,
    syncNow,
    clearCompleted,
    refresh,
  };
}
