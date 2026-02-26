/**
 * useSyncEngine Hook
 *
 * React hook exposing sync state for UI consumption.
 */

import { useEffect, useState } from 'react';
import { subscribeSyncState, getSyncState } from '../lib/syncEngine';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
}

export function useSyncEngine(): SyncState {
  const [state, setState] = useState<SyncState>(getSyncState);

  useEffect(() => {
    const unsubscribe = subscribeSyncState(() => {
      setState(getSyncState());
    });
    return unsubscribe;
  }, []);

  return state;
}
