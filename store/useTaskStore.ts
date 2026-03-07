import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { sendTaskEvent } from '@/lib/tinybird';

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
  addTask: (title: string, description: string, isDaily: boolean) => void;
  toggleTask: (id: string) => void;
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
      },
    }
  )
);
