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
      },

      deleteTask: (id: string) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      resetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDate } = get();

        if (today !== lastResetDate) {
          set((state) => ({
            lastResetDate: today,
            tasks: state.tasks
              // Remove completed one-time tasks
              .filter((t) => !(t.isCompleted && !t.isDaily))
              // Reset daily tasks
              .map((t) =>
                t.isDaily ? { ...t, isCompleted: false, completedAt: null } : t
              ),
          }));
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
