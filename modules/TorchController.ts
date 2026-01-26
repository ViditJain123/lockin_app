/**
 * TorchController - React Native wrapper for native torch control
 *
 * Controls the device flashlight/torch independently of expo-camera.
 * Works in both recording and non-recording states:
 * - When NOT recording: Controls torch directly via AVCaptureDevice
 * - When recording: Delegates to TimelapseSessionManager
 */

import { NativeModules, Platform } from 'react-native';

// Native module reference
const { TorchControllerModule } = NativeModules;

/**
 * Check if torch control is available on this platform
 */
export function isTorchAvailable(): boolean {
  return Platform.OS === 'ios' && TorchControllerModule !== null;
}

/**
 * Set torch on or off
 *
 * @param enabled - true to turn on, false to turn off
 * @returns Promise<boolean> - true if successful
 *
 * @example
 * ```ts
 * await setTorch(true);  // Turn on
 * await setTorch(false); // Turn off
 * ```
 */
export async function setTorch(enabled: boolean): Promise<boolean> {
  if (!isTorchAvailable()) {
    console.log('[TorchController] Not available on this platform');
    return false;
  }

  try {
    const success = await TorchControllerModule.setTorch(enabled);
    return success;
  } catch (error) {
    console.error('[TorchController] setTorch error:', error);
    return false;
  }
}

/**
 * Get current torch state
 *
 * @returns Promise<boolean> - true if torch is on
 *
 * @example
 * ```ts
 * const isOn = await getTorchState();
 * ```
 */
export async function getTorchState(): Promise<boolean> {
  if (!isTorchAvailable()) {
    return false;
  }

  try {
    return await TorchControllerModule.getTorchState();
  } catch (error) {
    console.error('[TorchController] getTorchState error:', error);
    return false;
  }
}

/**
 * Check if device has torch capability
 *
 * @returns Promise<boolean> - true if device has torch
 *
 * @example
 * ```ts
 * const hasTorch = await hasTorchCapability();
 * if (!hasTorch) {
 *   // Disable flash button
 * }
 * ```
 */
export async function hasTorchCapability(): Promise<boolean> {
  if (!isTorchAvailable()) {
    return false;
  }

  try {
    return await TorchControllerModule.hasTorch();
  } catch (error) {
    console.error('[TorchController] hasTorch error:', error);
    return false;
  }
}

/**
 * Turn off torch (convenience method for cleanup)
 *
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * // Call when stopping recording or switching cameras
 * await turnOffTorch();
 * ```
 */
export async function turnOffTorch(): Promise<void> {
  if (!isTorchAvailable()) {
    return;
  }

  try {
    await TorchControllerModule.turnOffTorch();
  } catch (error) {
    console.error('[TorchController] turnOffTorch error:', error);
  }
}

export default {
  isTorchAvailable,
  setTorch,
  getTorchState,
  hasTorchCapability,
  turnOffTorch,
};
