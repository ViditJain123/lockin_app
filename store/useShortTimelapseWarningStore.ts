import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const STORAGE_KEY = 'lockin-short-timelapse-warning-state';

interface ShortTimelapseWarningState {
  dontShowAgain: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setDontShowAgain: (value: boolean) => void;
  reset: () => void;
}

export const useShortTimelapseWarningStore = create<ShortTimelapseWarningState>()(
  persist(
    (set) => ({
      dontShowAgain: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setDontShowAgain: (value: boolean) => {
        set({ dontShowAgain: value });
      },

      reset: () => {
        set({ dontShowAgain: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dontShowAgain: state.dontShowAgain,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
