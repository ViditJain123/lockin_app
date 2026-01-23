import {
    startTimelapse,
    stopTimelapse,
    TimelapseError,
    TimelapseOptions,
    TimelapseResult
} from '@/modules/TimelapseEngine';
import { create } from 'zustand';

interface RecordingState {
  // Basic state
  isRecording: boolean;
  isPreparing: boolean;
  isFinishing: boolean;
  isCountingDown: boolean;

  // Recording stats
  frameCount: number;
  durationSeconds: number;
  estimatedOutputDuration: number;

  // Timer position (normalized 0-1 coordinates)
  timerPosition: { x: number; y: number };

  // Result
  lastResult: TimelapseResult | null;
  lastError: TimelapseError | null;

  // Actions
  startRecording: (options?: TimelapseOptions) => Promise<void>;
  stopRecording: () => Promise<TimelapseResult | null>;
  resetError: () => void;
  setCountingDown: (value: boolean) => void;
  setTimerPosition: (position: { x: number; y: number }) => void;

  // Internal actions
  _setRecordingState: (state: Partial<RecordingState>) => void;
}

/**
 * Zustand store for managing timelapse recording state.
 * STUBBED: Simulates recording flow without native integration.
 */
export const useRecordingStore = create<RecordingState>((set, get) => {
  // Local timer for 1-second duration updates
  let durationTimer: ReturnType<typeof setInterval> | null = null;
  let recordingStartTime: number | null = null;

  const startDurationTimer = () => {
    recordingStartTime = Date.now();
    // Update duration every second for smooth UI
    durationTimer = setInterval(() => {
      if (recordingStartTime) {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        set({ durationSeconds: elapsed });
      }
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }
    recordingStartTime = null;
  };

  return {
    // Initial state
    isRecording: false,
    isPreparing: false,
    isFinishing: false,
    isCountingDown: false,
    frameCount: 0,
    durationSeconds: 0,
    estimatedOutputDuration: 0,
    timerPosition: { x: 0.5, y: 0.15 },
    lastResult: null,
    lastError: null,

    // Start recording
    startRecording: async (options?: TimelapseOptions) => {
      const state = get();

      // Prevent multiple starts
      if (state.isRecording || state.isPreparing) {
        console.warn('[RecordingStore] Already recording or preparing');
        return;
      }

      // Set preparing state
      set({
        isPreparing: true,
        lastError: null,
        lastResult: null,
        frameCount: 0,
        durationSeconds: 0,
        estimatedOutputDuration: 0,
      });

      try {
        // Get timer position for overlay
        const timerPos = state.timerPosition;

        // Call native module to start recording
        await startTimelapse({
          ...options,
          timerPositionX: timerPos.x,
          timerPositionY: timerPos.y,
        });

        // Start local timer for UI updates
        startDurationTimer();

        set({
          isRecording: true,
          isPreparing: false,
        });

        console.log('[RecordingStore] Recording started');
      } catch (error) {
        set({
          isPreparing: false,
          lastError: {
            code: 'START_FAILED',
            message: error instanceof Error ? error.message : 'Failed to start recording',
          },
        });
        console.error('[RecordingStore] Failed to start:', error);
      }
    },

    // Stop recording - returns mock result with placeholder video
    stopRecording: async () => {
      const state = get();

      if (!state.isRecording) {
        console.warn('[RecordingStore] Not currently recording');
        return null;
      }

      // Capture the duration before stopping
      const finalDuration = state.durationSeconds;

      // Stop the local duration timer immediately
      stopDurationTimer();
      set({ isFinishing: true });

      try {
        // Get placeholder video result from stubbed engine
        const result = await stopTimelapse();

        // Override with actual recorded duration
        const finalResult: TimelapseResult = {
          ...result,
          durationSeconds: finalDuration,
        };

        set({
          isRecording: false,
          isFinishing: false,
          lastResult: finalResult,
        });

        console.log('[RecordingStore] Recording stopped, duration:', finalDuration);
        return finalResult;
      } catch (error) {
        set({
          isRecording: false,
          isFinishing: false,
          lastError: {
            code: 'STOP_FAILED',
            message: error instanceof Error ? error.message : 'Failed to stop recording',
          },
        });
        return null;
      }
    },

    // Reset error state
    resetError: () => {
      set({ lastError: null });
    },

    // Set counting down state
    setCountingDown: (value: boolean) => {
      set({ isCountingDown: value });
    },

    // Set timer position (normalized 0-1 coordinates)
    setTimerPosition: (position: { x: number; y: number }) => {
      set({ timerPosition: position });
    },

    // Internal: Update state
    _setRecordingState: (newState) => {
      set(newState);
    },
  };
});

// Selector hooks for common use cases
export const useIsRecording = () => useRecordingStore((s) => s.isRecording);
export const useRecordingDuration = () => useRecordingStore((s) => s.durationSeconds);
export const useFrameCount = () => useRecordingStore((s) => s.frameCount);
export const useRecordingError = () => useRecordingStore((s) => s.lastError);
export const useTimerPosition = () => useRecordingStore((s) => s.timerPosition);
