import * as Brightness from 'expo-brightness';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const WAKE_LOCK_TAG = 'timelapse-recording';
const DIMMED_BRIGHTNESS = 0.1; // 10% brightness when recording

/**
 * Custom hook to manage screen wake lock and brightness during recording.
 * 
 * When recording is active:
 * - Prevents the screen from timing out / going to sleep
 * - Dims the screen brightness to save battery
 * 
 * When recording stops:
 * - Restores original brightness
 * - Releases the wake lock
 */
export function useScreenWakeLock(isRecording: boolean) {
  const originalBrightnessRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const activateWakeLock = async () => {
      if (isActiveRef.current) return;
      isActiveRef.current = true;

      try {
        // Request brightness permissions (will prompt user if needed)
        const { status } = await Brightness.requestPermissionsAsync();
        
        if (status === 'granted') {
          // Store original brightness before dimming
          const currentBrightness = await Brightness.getBrightnessAsync();
          originalBrightnessRef.current = currentBrightness;
          
          // Dim the screen
          await Brightness.setBrightnessAsync(DIMMED_BRIGHTNESS);
          console.log('[WakeLock] Screen dimmed to', DIMMED_BRIGHTNESS);
        }
      } catch (error) {
        console.warn('[WakeLock] Failed to adjust brightness:', error);
      }

      try {
        // Keep the screen awake
        await activateKeepAwakeAsync(WAKE_LOCK_TAG);
        console.log('[WakeLock] Screen wake lock activated');
      } catch (error) {
        console.warn('[WakeLock] Failed to activate wake lock:', error);
      }
    };

    const deactivateWakeLock = async () => {
      if (!isActiveRef.current) return;
      isActiveRef.current = false;

      try {
        // Restore original brightness
        if (originalBrightnessRef.current !== null) {
          await Brightness.setBrightnessAsync(originalBrightnessRef.current);
          console.log('[WakeLock] Brightness restored to', originalBrightnessRef.current);
          originalBrightnessRef.current = null;
        }
      } catch (error) {
        console.warn('[WakeLock] Failed to restore brightness:', error);
      }

      try {
        // Release the wake lock
        deactivateKeepAwake(WAKE_LOCK_TAG);
        console.log('[WakeLock] Screen wake lock deactivated');
      } catch (error) {
        console.warn('[WakeLock] Failed to deactivate wake lock:', error);
      }
    };

    if (isRecording) {
      activateWakeLock();
    } else {
      deactivateWakeLock();
    }

    // Cleanup on unmount
    return () => {
      if (isActiveRef.current) {
        deactivateWakeLock();
      }
    };
  }, [isRecording]);
}
