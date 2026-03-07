import { create } from 'zustand';

interface RecordingState {
  isSessionActive: boolean;
  isFinishing: boolean;
  isPreparing: boolean;
  isCountingDown: boolean;
  activeTaskId: string | null;
  setIsSessionActive: (value: boolean) => void;
  setIsFinishing: (value: boolean) => void;
  setIsPreparing: (value: boolean) => void;
  setIsCountingDown: (value: boolean) => void;
  setActiveTaskId: (id: string | null) => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isSessionActive: false,
  isFinishing: false,
  isPreparing: false,
  isCountingDown: false,
  activeTaskId: null,
  setIsSessionActive: (value) => set({ isSessionActive: value }),
  setIsFinishing: (value) => set({ isFinishing: value }),
  setIsPreparing: (value) => set({ isPreparing: value }),
  setIsCountingDown: (value) => set({ isCountingDown: value }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),
}));
