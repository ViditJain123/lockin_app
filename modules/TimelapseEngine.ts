/**
 * TimelapseEngine - Native Module Bridge
 *
 * Connects to the iOS TimelapseEngine native module for real-time
 * timelapse recording with adaptive capture rate.
 *
 * Features:
 * - Real-time H.264/HEVC encoding at 60fps
 * - Adaptive capture rate (2fps base, slows for long recordings)
 * - Zero-wait finalization - video ready instantly when stopping
 * - 10-hour recording support
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export interface TimelapseOptions {
  captureIntervalMs?: number;
  outputFps?: number;
  codec?: 'h264' | 'hevc';
  saveToGallery?: boolean;
  cameraPosition?: 'front' | 'back';
  targetVideoSeconds?: number;
  timerPositionX?: number;
  timerPositionY?: number;
}

export interface TimelapseState {
  state: 'idle' | 'preparing' | 'recording' | 'finalizing' | 'error';
  isRecording: boolean;
  frameCount: number;
  durationSeconds: number;
  estimatedOutputDuration: number;
}

export interface TimelapseProgress {
  frameCount: number;
  durationSeconds: number;
  estimatedOutputDuration: number;
}

export interface TimelapseResult {
  uri: string;
  assetId?: string;
  frameCount: number;
  durationSeconds: number;
}

export interface TimelapseError {
  code: string;
  message: string;
}

// ============================================================================
// Native Module Access
// ============================================================================

const { TimelapseEngine: NativeTimelapseEngine } = NativeModules;

// Create event emitter only if native module exists
const eventEmitter = NativeTimelapseEngine
  ? new NativeEventEmitter(NativeTimelapseEngine)
  : null;

// ============================================================================
// Main API
// ============================================================================

/**
 * Check if timelapse is available on this platform
 */
export function isTimelapseAvailable(): boolean {
  return Platform.OS === 'ios' && NativeTimelapseEngine != null;
}

/**
 * Start timelapse recording with configuration options
 */
export async function startTimelapse(options: TimelapseOptions = {}): Promise<void> {
  if (!isTimelapseAvailable()) {
    throw new Error('Timelapse is not available on this platform');
  }

  console.log('[TimelapseEngine] Starting timelapse with options:', options);
  return NativeTimelapseEngine.startTimelapse(options);
}

/**
 * Stop timelapse recording and finalize video
 * Returns immediately with video URL - no waiting required
 */
export async function stopTimelapse(): Promise<TimelapseResult> {
  if (!isTimelapseAvailable()) {
    throw new Error('Timelapse is not available on this platform');
  }

  console.log('[TimelapseEngine] Stopping timelapse');
  return NativeTimelapseEngine.stopTimelapse();
}

/**
 * Get the current recording state
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
 */
export async function isCallInProgress(): Promise<boolean> {
  if (!isTimelapseAvailable()) {
    return false;
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
 * Returns unsubscribe function
 */
export function onTimelapseProgress(callback: ProgressCallback): () => void {
  if (!eventEmitter) {
    return () => {};
  }

  const subscription = eventEmitter.addListener('onTimelapseProgress', callback);
  return () => subscription.remove();
}

/**
 * Subscribe to error events
 * Returns unsubscribe function
 */
export function onTimelapseError(callback: ErrorCallback): () => void {
  if (!eventEmitter) {
    return () => {};
  }

  const subscription = eventEmitter.addListener('onTimelapseError', (event) => {
    callback({ code: 'ERROR', message: event.message });
  });
  return () => subscription.remove();
}

/**
 * Subscribe to completion event
 * Returns unsubscribe function
 */
export function onTimelapseComplete(callback: CompleteCallback): () => void {
  if (!eventEmitter) {
    return () => {};
  }

  const subscription = eventEmitter.addListener('onTimelapseComplete', callback);
  return () => subscription.remove();
}

// ============================================================================
// Utility Functions (UNCHANGED)
// ============================================================================

/**
 * Format duration in seconds to HH:MM:SS string
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  captureIntervalMs: number = 500,
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
