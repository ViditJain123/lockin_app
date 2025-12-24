import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  setRecording: (value: boolean) => void;
  toggleRecording: () => void;
}

/**
 * Zustand store for managing recording state across the app.
 * This provides a single source of truth for the recording state,
 * which drives all animations and UI changes.
 */
export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  setRecording: (value) => set({ isRecording: value }),
  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
}));
