import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface LocalSession {
  session_id: string;
  date: string; // YYYY-MM-DD
  total_locked_in_seconds: number;
  total_distracted_seconds: number;
  distraction_count: number;
  created_at: string; // ISO datetime
  time_started?: string; // ISO datetime (optional for backward compat)
  time_ended?: string;   // ISO datetime (optional for backward compat)
}

interface SessionStoreState {
  sessions: LocalSession[];
  hasHydrated: boolean;
  addSession: (session: LocalSession) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set) => ({
      sessions: [],
      hasHydrated: false,
      addSession: (session) =>
        set((state) => {
          const newSessions = [...state.sessions, session];
          console.log('[SessionStore] addSession: total sessions now:', newSessions.length, 'added:', session.session_id);
          return { sessions: newSessions };
        }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'lockin-sessions-local',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('[SessionStore] Hydrated:', state.sessions.length, 'sessions');
          state.setHasHydrated(true);
        } else {
          console.log('[SessionStore] Hydration returned null state (fresh install)');
        }
      },
    }
  )
);
