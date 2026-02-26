/**
 * Task Store
 *
 * Zustand store for managing daily/one-time tasks.
 * Persisted with AsyncStorage. Daily tasks reset each morning;
 * completed one-time tasks are removed on new day.
 *
 * Mutations enqueue changes to the sync engine for DB-first sync.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateString } from '../lib/dateUtils';
import { enqueueChange } from '../lib/syncEngine';

const TASK_STORAGE_KEY = 'lockin-tasks-storage';

export interface Task {
  id: string;
  title: string;
  description: string;
  isDaily: boolean;
  isCompleted: boolean;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
  updatedAt: string; // ISO string — set on every mutation
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

  // Called by sync engine after conflict resolution
  updateFromRemote: (tasks: Task[]) => void;
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
        const now = new Date().toISOString();
        const newTask: Task = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title,
          description,
          isDaily,
          isCompleted: false,
          createdAt: now,
          completedAt: null,
          updatedAt: now,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        enqueueChange('TASK_UPSERT', newTask.id, newTask);
      },

      toggleTask: (id: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  isCompleted: !task.isCompleted,
                  completedAt: !task.isCompleted ? now : null,
                  updatedAt: now,
                }
              : task
          ),
        }));

        const updatedTask = get().tasks.find((t) => t.id === id);
        if (updatedTask) {
          enqueueChange('TASK_UPSERT', updatedTask.id, updatedTask);
        }
      },

      deleteTask: (id: string) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

        enqueueChange('TASK_DELETE', id, { taskId: id });
      },

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      resetForNewDay: () => {
        const today = getLocalDateString();
        const { lastResetDate, tasks } = get();

        if (today !== lastResetDate) {
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
                t.isDaily
                  ? { ...t, isCompleted: false, completedAt: null, updatedAt: new Date().toISOString() }
                  : t
              ),
          }));

          enqueueChange('TASK_RESET', 'daily-reset', {
            completedOneTimeIds,
            dailyTaskIds,
          });
        }
      },

      updateFromRemote: (tasks: Task[]) => {
        set({ tasks });
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
