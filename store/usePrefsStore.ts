import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Small device-local preferences (not synced).
interface PrefsState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    }),
    {
      name: 'lockin-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
