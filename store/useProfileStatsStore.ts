import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ProfileStatsState {
  total_hours: number;
  grinds: number;
  streak: number;
  hasHydrated: boolean;
  setStats: (stats: { total_hours: number; grinds: number; streak: number }) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useProfileStatsStore = create<ProfileStatsState>()(
  persist(
    (set) => ({
      total_hours: 0,
      grinds: 0,
      streak: 0,
      hasHydrated: false,
      setStats: (stats) => set(stats),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'lockin-profile-stats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        total_hours: state.total_hours,
        grinds: state.grinds,
        streak: state.streak,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
