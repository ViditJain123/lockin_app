/**
 * Grinds Store
 *
 * Local cache of grind session metadata, synced from the Supabase `grinds` table.
 * Used by analytics to compute session-level metrics (count, longest, avg, hourly).
 * Persisted to AsyncStorage so analytics work offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
  syncFromSupabase: (userId: string) => Promise<void>;
  addGrindLocally: (grind: GrindSession) => void;
}

export const useGrindsStore = create<GrindsState>()(
  persist(
    (set, get) => ({
      grinds: [],
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      syncFromSupabase: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('grinds')
            .select('id, created_at, duration_ms')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[GrindsStore] Failed to sync from Supabase:', error);
            return;
          }

          const supabaseGrinds: GrindSession[] = (data || []).map((row) => ({
            id: row.id,
            createdAt: row.created_at,
            durationSeconds: (row.duration_ms || 0) / 1000,
          }));

          // Merge: keep local grinds that aren't in Supabase (may not have synced yet)
          const localGrinds = get().grinds;
          const supabaseIds = new Set(supabaseGrinds.map((g) => g.id));
          const localOnly = localGrinds.filter((g) => !supabaseIds.has(g.id));
          const merged = [...supabaseGrinds, ...localOnly]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          set({ grinds: merged });
          console.log('[GrindsStore] Synced', supabaseGrinds.length, 'from Supabase, kept', localOnly.length, 'local-only grinds');
        } catch (error) {
          console.error('[GrindsStore] Sync error:', error);
        }
      },

      addGrindLocally: (grind: GrindSession) => {
        set((state) => ({
          grinds: [grind, ...state.grinds],
        }));
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
