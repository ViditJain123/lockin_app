/**
 * TimelapseEngine - React Native wrapper for iOS native timelapse module
 *
 * Production-ready timelapse recording with:
 * - 1fps capture → 60fps output (60x speedup)
 * - Real-time encoding (zero-wait export)
 * - 3-4 hour continuous recording capability
 * - Direct save to Photos library
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// Native module reference
const { TimelapseEngine: NativeTimelapseEngine } = NativeModules;

// Event emitter for native events
const TimelapseEventEmitter = NativeTimelapseEngine
  ? new NativeEventEmitter(NativeTimelapseEngine)
  : null;

// ============================================================================
// Types
// ============================================================================

/**
 * Timer filter type for overlay variants
 * - 'minimal': Timer with "LOCKIN CLUB" text, semi-transparent background, no border
 * - 'dateStamp': Timer, date, and logo right-aligned, no background
 */
export type TimerFilterType = 'minimal' | 'dateStamp';

export interface TimelapseOptions {
  /**
   * Capture interval in milliseconds
   * Default: 1000 (1 frame per second)
   */
  captureIntervalMs?: number;

  /**
   * Output video frame rate
   * Default: 60
   */
  outputFps?: number;

  /**
   * Video codec
   * Default: 'h264'
   */
  codec?: 'h264' | 'hevc';

  /**
   * Whether to save to Photos library on completion
   * Default: true
   */
  saveToGallery?: boolean;

  /**
   * Camera position to use for recording
   * Default: 'back'
   */
  cameraPosition?: 'front' | 'back';

  /**
   * Target maximum video duration in seconds for adaptive capture.
   * The capture interval will dynamically increase for longer recordings
   * to keep the output video approximately this length.
   * Default: 30
   */
  targetVideoSeconds?: number;

  /**
   * Timer position as percentage (0-1) of the frame.
   * x: 0 = left edge, 1 = right edge
   * y: 0 = top edge, 1 = bottom edge
   * Position represents the center of the timer text.
   * Default: { x: 0.85, y: 0.75 }
   */
  timerPosition?: { x: number; y: number };

  /**
   * Device orientation for rotating timer text in the video.
   * - 'portrait': No rotation (default)
   * - 'landscape-left': Timer rotates 90deg clockwise
   * - 'landscape-right': Timer rotates 90deg counter-clockwise
   * Default: 'portrait'
   */
  orientation?: 'portrait' | 'landscape-left' | 'landscape-right';

  /**
   * Timer overlay filter type
   * - 'minimal': Timer with "LOCKIN CLUB" text, semi-transparent background, no border
   * - 'dateStamp': Timer, date, and logo right-aligned, no background
   * Default: 'minimal'
   */
  timerFilter?: TimerFilterType;

  /**
   * Timer overlay scale factor
   * - 1.0: Default size
   * - Max: 2.5
   * Default: 1.0
   */
  timerScale?: number;
}

export interface TimelapseState {
  /** Current engine state */
  state: 'idle' | 'preparing' | 'recording' | 'finalizing' | 'error';

  /** Whether actively recording */
  isRecording: boolean;

  /** Number of frames captured */
  frameCount: number;

  /** Recording duration in seconds (real-world time) */
  durationSeconds: number;

  /** Estimated output video duration in seconds */
  estimatedOutputDuration: number;
}

export interface TimelapseProgress {
  /** Number of frames captured */
  frameCount: number;

  /** Recording duration in seconds (real-world time) */
  durationSeconds: number;

  /** Estimated output video duration in seconds */
  estimatedOutputDuration: number;
}

export interface TimelapseResult {
  /** File URI of the saved video */
  uri: string;

  /** Photos library asset identifier (if saved to gallery) */
  assetId?: string;

  /** Total frames captured */
  frameCount: number;

  /** Total recording duration in seconds */
  durationSeconds: number;
}

export interface TimelapseError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;
}

// ============================================================================
// Type Guards
// ============================================================================

function isTimelapseResult(obj: unknown): obj is TimelapseResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'uri' in obj &&
    'frameCount' in obj
  );
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Check if timelapse is available on this platform
 */
export function isTimelapseAvailable(): boolean {
  return Platform.OS === 'ios' && NativeTimelapseEngine !== null;
}

/**
 * Start timelapse recording
 *
 * @param options - Recording configuration options
 * @returns Promise that resolves when recording starts
 * @throws Error if recording fails to start
 *
 * @example
 * ```ts
 * await startTimelapse({
 *   captureIntervalMs: 1000,  // 1fps capture
 *   outputFps: 60,            // 60fps output
 *   codec: 'h264',
 *   saveToGallery: true,
 * });
 * ```
 */
export async function startTimelapse(options: TimelapseOptions = {}): Promise<void> {
  if (!isTimelapseAvailable()) {
    throw new Error('Timelapse is only available on iOS');
  }

  const timerPos = options.timerPosition ?? { x: 0.85, y: 0.75 };

  const fullOptions = {
    captureIntervalMs: options.captureIntervalMs ?? 1000,
    outputFps: options.outputFps ?? 60,
    codec: options.codec ?? 'h264',
    saveToGallery: options.saveToGallery ?? true,
    cameraPosition: options.cameraPosition ?? 'back',
    targetVideoSeconds: options.targetVideoSeconds ?? 30,
    timerPositionX: timerPos.x,
    timerPositionY: timerPos.y,
    orientation: options.orientation ?? 'portrait',
    timerFilter: options.timerFilter ?? 'minimal',
    timerScale: options.timerScale ?? 1.0,
  };

  await NativeTimelapseEngine.startTimelapse(fullOptions);
}

/**
 * Stop timelapse recording and get the result
 *
 * @returns Promise with the saved video information
 * @throws Error if stop fails or no recording in progress
 *
 * @example
 * ```ts
 * const result = await stopTimelapse();
 * console.log(`Saved ${result.frameCount} frames to ${result.uri}`);
 * ```
 */
export async function stopTimelapse(): Promise<TimelapseResult> {
  if (!isTimelapseAvailable()) {
    throw new Error('Timelapse is only available on iOS');
  }

  const result = await NativeTimelapseEngine.stopTimelapse();

  if (!isTimelapseResult(result)) {
    throw new Error('Invalid result from native module');
  }

  return result;
}

/**
 * Get the current recording state
 *
 * @returns Promise with current state information
 *
 * @example
 * ```ts
 * const state = await getRecordingState();
 * if (state.isRecording) {
 *   console.log(`Recording for ${state.durationSeconds}s`);
 * }
 * ```
 */
export async function getRecordingState(): Promise<TimelapseState> {
  if (!isTimelapseAvailable()) {
    return {
      state: 'idle',
      isRecording: false,
      frameCount: 0,
      durationSeconds: 0,
      estimatedOutputDuration: 0,
    };
  }

  return NativeTimelapseEngine.getRecordingState();
}

/**
 * Check if a phone call is currently in progress
 * 
 * @returns Promise<boolean> - true if a call is active, false otherwise
 * 
 * @example
 * ```ts
 * if (await isCallInProgress()) {
 *   Alert.alert('End Call', 'Please end your phone call to start recording.');
 *   return;
 * }
 * ```
 */
export async function isCallInProgress(): Promise<boolean> {
  if (!isTimelapseAvailable()) {
    return false; // Not on iOS, can't detect calls
  }

  return NativeTimelapseEngine.isCallInProgress();
}

// ============================================================================
// Event Subscriptions
// ============================================================================

type ProgressCallback = (progress: TimelapseProgress) => void;
type ErrorCallback = (error: TimelapseError) => void;
type CompleteCallback = (result: TimelapseResult) => void;

/**
 * Subscribe to progress updates during recording
 *
 * @param callback - Called with progress updates (every ~5 seconds)
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onTimelapseProgress((progress) => {
 *   console.log(`Captured ${progress.frameCount} frames`);
 * });
 *
 * // Later: cleanup
 * unsubscribe();
 * ```
 */
export function onTimelapseProgress(callback: ProgressCallback): () => void {
  if (!TimelapseEventEmitter) {
    return () => {};
  }

  const subscription = TimelapseEventEmitter.addListener(
    'onTimelapseProgress',
    callback
  );

  return () => subscription.remove();
}

/**
 * Subscribe to error events during recording
 *
 * @param callback - Called when an error occurs
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onTimelapseError((error) => {
 *   console.error(`Timelapse error: ${error.message}`);
 * });
 * ```
 */
export function onTimelapseError(callback: ErrorCallback): () => void {
  if (!TimelapseEventEmitter) {
    return () => {};
  }

  const subscription = TimelapseEventEmitter.addListener(
    'onTimelapseError',
    callback
  );

  return () => subscription.remove();
}

/**
 * Subscribe to completion event
 *
 * @param callback - Called when recording completes successfully
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onTimelapseComplete((result) => {
 *   console.log(`Video saved to: ${result.uri}`);
 * });
 * ```
 */
export function onTimelapseComplete(callback: CompleteCallback): () => void {
  if (!TimelapseEventEmitter) {
    return () => {};
  }

  const subscription = TimelapseEventEmitter.addListener(
    'onTimelapseComplete',
    callback
  );

  return () => subscription.remove();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in seconds to HH:MM:SS string
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate speedup factor from capture interval to output fps
 */
export function calculateSpeedup(captureIntervalMs: number, outputFps: number): number {
  const captureFramesPerSecond = 1000 / captureIntervalMs;
  return outputFps / captureFramesPerSecond;
}

/**
 * Estimate the output duration from recording duration
 */
export function estimateOutputDuration(
  recordingDurationSeconds: number,
  captureIntervalMs: number = 1000,
  outputFps: number = 60
): number {
  const speedup = calculateSpeedup(captureIntervalMs, outputFps);
  return recordingDurationSeconds / speedup;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  isTimelapseAvailable,
  startTimelapse,
  stopTimelapse,
  getRecordingState,
  isCallInProgress,
  onTimelapseProgress,
  onTimelapseError,
  onTimelapseComplete,
  formatDuration,
  calculateSpeedup,
  estimateOutputDuration,
};
