import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { sendTaskEvent, fetchActiveTasks } from '@/lib/tinybird';

export interface Task {
  id: string;
  title: string;
  description: string;
  isDaily: boolean;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

interface TaskState {
  tasks: Task[];
  lastResetDate: string | null;
  userId: string | null;
  hasHydrated: boolean;

  setUserId: (userId: string | null) => void;
  setHasHydrated: (v: boolean) => void;
  restoreFromTinybird: (userId: string) => Promise<void>;
  addTask: (title: string, description: string, isDaily: boolean) => void;
  toggleTask: (id: string) => void;
  /** Idempotent — marks the task complete if it isn't already. No-op if the
   * task is missing or already completed. */
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;
  performDailyReset: () => void;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      lastResetDate: null,
      userId: null,
      hasHydrated: false,

      setUserId: (userId) => set({ userId }),
      setHasHydrated: (v) => set({ hasHydrated: v }),

      restoreFromTinybird: async (userId: string) => {
        try {
          const rows = await fetchActiveTasks(userId);
          if (rows.length === 0) return;

          const now = new Date().toISOString();
          const restoredTasks: Task[] = rows.map((row) => ({
            id: row.task_id,
            title: row.title,
            description: '',
            isDaily: !!row.is_daily,
            isCompleted: !!row.is_completed,
            createdAt: row.timestamp,
            completedAt: row.is_completed ? row.timestamp : null,
            updatedAt: now,
          }));

          set({ tasks: restoredTasks });
          console.log(`[TaskStore] Restored ${restoredTasks.length} tasks from Tinybird`);
        } catch (error) {
          console.warn('[TaskStore] Failed to restore tasks from Tinybird:', error);
        }
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

        const { userId } = get();
        sendTaskEvent({
          event_type: 'task_create',
          task_id: newTask.id,
          user_id: userId ?? 'anonymous',
          title,
          is_daily: isDaily,
          timestamp: now,
        }).catch(() => {});
      },

      toggleTask: (id: string) => {
        const now = new Date().toISOString();
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const willBeCompleted = !task.isCompleted;
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isCompleted: willBeCompleted,
                  completedAt: willBeCompleted ? now : null,
                  updatedAt: now,
                }
              : t
          ),
        }));

        const { userId } = get();
        sendTaskEvent({
          event_type: willBeCompleted ? 'task_complete' : 'task_uncomplete',
          task_id: id,
          user_id: userId ?? 'anonymous',
          title: task.title,
          is_daily: task.isDaily,
          timestamp: now,
        }).catch(() => {});
      },

      completeTask: (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task || task.isCompleted) return;

        const now = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, isCompleted: true, completedAt: now, updatedAt: now }
              : t
          ),
        }));

        const { userId } = get();
        sendTaskEvent({
          event_type: 'task_complete',
          task_id: id,
          user_id: userId ?? 'anonymous',
          title: task.title,
          is_daily: task.isDaily,
          timestamp: now,
        }).catch(() => {});
      },

      deleteTask: (id: string) => {
        const task = get().tasks.find((t) => t.id === id);
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

        if (task) {
          const { userId } = get();
          sendTaskEvent({
            event_type: 'task_delete',
            task_id: id,
            user_id: userId ?? 'anonymous',
            title: task.title,
            is_daily: task.isDaily,
            timestamp: new Date().toISOString(),
          }).catch(() => {});
        }
      },

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id);
      },

      performDailyReset: () => {
        const today = getTodayDateString();
        const { lastResetDate } = get();
        if (lastResetDate === today) return;

        set((state) => ({
          tasks: state.tasks
            // Remove completed one-time tasks
            .filter((t) => t.isDaily || !t.isCompleted)
            // Reset daily tasks
            .map((t) =>
              t.isDaily
                ? { ...t, isCompleted: false, completedAt: null, updatedAt: new Date().toISOString() }
                : t
            ),
          lastResetDate: today,
        }));
      },
    }),
    {
      name: 'lockin-tasks',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        lastResetDate: state.lastResetDate,
        userId: state.userId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state && state.tasks.length === 0 && state.userId) {
          state.restoreFromTinybird(state.userId);
        }
      },
    }
  )
);
