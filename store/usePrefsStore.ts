import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FocusSoundId } from '@/lib/focusSound';

// Small device-local preferences (not synced).
interface PrefsState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  // Background noise played during a session
  focusSound: FocusSoundId;
  setFocusSound: (id: FocusSoundId) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      focusSound: 'off',
      setFocusSound: (focusSound) => set({ focusSound }),
    }),
    {
      name: 'lockin-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
