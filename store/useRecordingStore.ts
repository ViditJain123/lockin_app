import { create } from 'zustand';

interface RecordingState {
  isSessionActive: boolean;
  isFinishing: boolean;
  isPreparing: boolean;
  isCountingDown: boolean;
  setIsSessionActive: (value: boolean) => void;
  setIsFinishing: (value: boolean) => void;
  setIsPreparing: (value: boolean) => void;
  setIsCountingDown: (value: boolean) => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isSessionActive: false,
  isFinishing: false,
  isPreparing: false,
  isCountingDown: false,
  setIsSessionActive: (value) => set({ isSessionActive: value }),
  setIsFinishing: (value) => set({ isFinishing: value }),
  setIsPreparing: (value) => set({ isPreparing: value }),
  setIsCountingDown: (value) => set({ isCountingDown: value }),
}));
