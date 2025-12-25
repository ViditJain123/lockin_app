import {
    isTimelapseAvailable,
    onTimelapseComplete,
    onTimelapseError,
    onTimelapseProgress,
    startTimelapse,
    stopTimelapse,
    TimelapseError,
    TimelapseOptions,
    TimelapseProgress,
    TimelapseResult
} from '@/modules/TimelapseEngine';
import { create } from 'zustand';

interface RecordingState {
  // Basic state
  isRecording: boolean;
  isPreparing: boolean;
  isFinishing: boolean;

  // Recording stats
  frameCount: number;
  durationSeconds: number;
  estimatedOutputDuration: number;

  // Result
  lastResult: TimelapseResult | null;
  lastError: TimelapseError | null;

  // Actions
  startRecording: (options?: TimelapseOptions) => Promise<void>;
  stopRecording: () => Promise<TimelapseResult | null>;
  resetError: () => void;

  // Internal actions
  _setRecordingState: (state: Partial<RecordingState>) => void;
  _handleProgress: (progress: TimelapseProgress) => void;
  _handleError: (error: TimelapseError) => void;
  _handleComplete: (result: TimelapseResult) => void;
}

/**
 * Zustand store for managing timelapse recording state.
 * Integrates with the native iOS TimelapseEngine module.
 */
export const useRecordingStore = create<RecordingState>((set, get) => {
  // Event subscriptions
  let progressUnsubscribe: (() => void) | null = null;
  let errorUnsubscribe: (() => void) | null = null;
  let completeUnsubscribe: (() => void) | null = null;
  
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

  const setupEventListeners = () => {
    if (!isTimelapseAvailable()) return;

    progressUnsubscribe = onTimelapseProgress((progress) => {
      get()._handleProgress(progress);
    });

    errorUnsubscribe = onTimelapseError((error) => {
      get()._handleError(error);
    });

    completeUnsubscribe = onTimelapseComplete((result) => {
      get()._handleComplete(result);
    });
  };

  const cleanupEventListeners = () => {
    progressUnsubscribe?.();
    errorUnsubscribe?.();
    completeUnsubscribe?.();
    progressUnsubscribe = null;
    errorUnsubscribe = null;
    completeUnsubscribe = null;
  };

  return {
    // Initial state
    isRecording: false,
    isPreparing: false,
    isFinishing: false,
    frameCount: 0,
    durationSeconds: 0,
    estimatedOutputDuration: 0,
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

      // Check platform support
      if (!isTimelapseAvailable()) {
        set({
          lastError: {
            code: 'PLATFORM_NOT_SUPPORTED',
            message: 'Timelapse is only available on iOS',
          },
        });
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

      // Setup event listeners
      setupEventListeners();

      try {
        await startTimelapse(options);
        // Start local timer for 1-second updates
        startDurationTimer();
        set({
          isRecording: true,
          isPreparing: false,
        });
      } catch (error) {
        cleanupEventListeners();
        stopDurationTimer();
        set({
          isRecording: false,
          isPreparing: false,
          lastError: {
            code: 'START_FAILED',
            message: error instanceof Error ? error.message : 'Failed to start recording',
          },
        });
      }
    },

    // Stop recording
    stopRecording: async () => {
      const state = get();
      
      if (!state.isRecording) {
        console.warn('[RecordingStore] Not currently recording');
        return null;
      }

      // Stop the local duration timer immediately
      stopDurationTimer();
      set({ isFinishing: true });

      try {
        const result = await stopTimelapse();
        cleanupEventListeners();
        set({
          isRecording: false,
          isFinishing: false,
          lastResult: result,
        });
        return result;
      } catch (error) {
        cleanupEventListeners();
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

    // Internal: Update state
    _setRecordingState: (newState) => {
      set(newState);
    },

    // Internal: Handle progress updates
    _handleProgress: (progress) => {
      set({
        frameCount: progress.frameCount,
        durationSeconds: progress.durationSeconds,
        estimatedOutputDuration: progress.estimatedOutputDuration,
      });
    },

    // Internal: Handle errors
    _handleError: (error) => {
      set({ lastError: error });
    },

    // Internal: Handle completion
    _handleComplete: (result) => {
      set({
        isRecording: false,
        isFinishing: false,
        lastResult: result,
        frameCount: result.frameCount,
        durationSeconds: result.durationSeconds,
      });
    },
  };
});

// Selector hooks for common use cases
export const useIsRecording = () => useRecordingStore((s) => s.isRecording);
export const useRecordingDuration = () => useRecordingStore((s) => s.durationSeconds);
export const useFrameCount = () => useRecordingStore((s) => s.frameCount);
export const useRecordingError = () => useRecordingStore((s) => s.lastError);
