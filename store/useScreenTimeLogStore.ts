import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Per-day screen time spent from the earned bank (seconds), keyed YYYY-MM-DD.
// The app-lock store resets its counters nightly; this keeps the history so
// the dashboard can chart screen time against lock-in time.
interface ScreenTimeLogState {
  byDate: Record<string, number>;
  record: (date: string, seconds: number) => void;
}

export const useScreenTimeLogStore = create<ScreenTimeLogState>()(
  persist(
    (set) => ({
      byDate: {},
      record: (date, seconds) =>
        set((s) => ({ byDate: { ...s.byDate, [date]: Math.max(s.byDate[date] ?? 0, seconds) } })),
    }),
    { name: 'lockin-screen-time-log', storage: createJSONStorage(() => AsyncStorage) }
  )
);
