/**
 * Task Store
 *
 * Zustand store for managing daily/one-time tasks.
 * Persisted with AsyncStorage. Daily tasks reset each morning;
 * completed one-time tasks are removed on new day.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';
import { pushTaskUpsert, pushTaskDelete, pushTasksResetForNewDay, pullUserTasks } from '../lib/syncService';
import { supabase } from '../lib/supabase';

const TASK_STORAGE_KEY = 'lockin-tasks-storage';

export interface Task {
  id: string;
  title: string;
  description: string;
  isDaily: boolean;
  isCompleted: boolean;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
}

interface TaskState {
  tasks: Task[];
  lastResetDate: string;
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  addTask: (title: string, description: string, isDaily: boolean) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;
  resetForNewDay: () => void;

  // Sync actions
  syncTasksFromSupabase: () => Promise<void>;
}

// Helper to get current user ID (returns null if not authenticated)
async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      lastResetDate: getLocalDateString(),
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addTask: (title: string, description: string, isDaily: boolean) => {
        const newTask: Task = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title,
          description,
          isDaily,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // Fire-and-forget sync
        getCurrentUserId().then((uid) => {
          if (uid) pushTaskUpsert(uid, newTask);
        });
      },

      toggleTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  isCompleted: !task.isCompleted,
                  completedAt: !task.isCompleted ? new Date().toISOString() : null,
                }
              : task
          ),
        }));

        // Fire-and-forget sync
        const updatedTask = get().tasks.find((t) => t.id === id);
        if (updatedTask) {
          getCurrentUserId().then((uid) => {
            if (uid) pushTaskUpsert(uid, updatedTask);
          });
        }
      },

      deleteTask: (id: string) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

        // Fire-and-forget sync
        getCurrentUserId().then((uid) => {
          if (uid) pushTaskDelete(uid, id);
        });
      },

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      resetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDate, tasks } = get();

        if (today !== lastResetDate) {
          // Identify tasks to sync before mutating state
          const completedOneTimeIds = tasks
            .filter((t) => t.isCompleted && !t.isDaily)
            .map((t) => t.id);
          const dailyTaskIds = tasks
            .filter((t) => t.isDaily)
            .map((t) => t.id);

          set((state) => ({
            lastResetDate: today,
            tasks: state.tasks
              .filter((t) => !(t.isCompleted && !t.isDaily))
              .map((t) =>
                t.isDaily ? { ...t, isCompleted: false, completedAt: null } : t
              ),
          }));

          // Fire-and-forget sync
          getCurrentUserId().then((uid) => {
            if (uid) pushTasksResetForNewDay(uid, completedOneTimeIds, dailyTaskIds);
          });
        }
      },

      // Pull tasks from Supabase and merge (Supabase wins)
      syncTasksFromSupabase: async () => {
        try {
          const uid = await getCurrentUserId();
          if (!uid) return;
          const remoteTasks = await pullUserTasks(uid);
          if (remoteTasks.length > 0) {
            set({ tasks: remoteTasks });
          }
        } catch (err) {
          console.error('[TaskStore] syncTasksFromSupabase error:', err);
        }
      },
    }),
    {
      name: TASK_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        lastResetDate: state.lastResetDate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.resetForNewDay();
      },
    }
  )
);
