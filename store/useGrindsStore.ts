/**
 * Grinds Store
 *
 * Local cache of grind session metadata, synced via the sync engine.
 * Used by analytics to compute session-level metrics (count, longest, avg, hourly).
 * Persisted to AsyncStorage so analytics work offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
const GRINDS_STORAGE_KEY = 'lockin-grinds-cache';

export interface GrindSession {
  id: string;
  createdAt: string;       // ISO string
  durationSeconds: number;
}

interface GrindsState {
  grinds: GrindSession[];
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  addGrindLocally: (grind: GrindSession) => void;

  // Called by sync engine after conflict resolution
  updateFromRemote: (grinds: GrindSession[]) => void;
}

export const useGrindsStore = create<GrindsState>()(
  persist(
    (set, get) => ({
      grinds: [],
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addGrindLocally: (grind: GrindSession) => {
        set((state) => ({
          grinds: [grind, ...state.grinds],
        }));
        // Note: GRIND_RECORD enqueue is handled by useVideoStore.addVideo
        // to avoid double-enqueue since addGrindLocally is called from there.
      },

      updateFromRemote: (grinds: GrindSession[]) => {
        set({ grinds });
      },
    }),
    {
      name: GRINDS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        grinds: state.grinds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
