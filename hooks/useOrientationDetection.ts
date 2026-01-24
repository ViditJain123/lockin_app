import { useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { DeviceOrientation, useRecordingStore } from '@/store/useRecordingStore';

/**
 * Maps DeviceMotion orientation (in degrees) to our simplified orientation types.
 *
 * DeviceMotion orientation values:
 * - 0: Portrait (upright)
 * - 90: Landscape Right (device rotated counter-clockwise, home button on right)
 * - -90: Landscape Left (device rotated clockwise, home button on left)
 * - 180: Portrait upside down
 */
function mapMotionOrientation(orientationDegrees: number): DeviceOrientation {
  // Use thresholds to handle minor fluctuations
  if (orientationDegrees >= -135 && orientationDegrees < -45) {
    // Around -90 degrees: device rotated clockwise, home button on left
    return 'landscape-left';
  } else if (orientationDegrees >= 45 && orientationDegrees < 135) {
    // Around 90 degrees: device rotated counter-clockwise, home button on right
    return 'landscape-right';
  } else {
    // Around 0 or 180 degrees: portrait
    return 'portrait';
  }
}

/**
 * Hook that detects device physical orientation using DeviceMotion from expo-sensors.
 *
 * This approach detects actual physical device orientation regardless of UI lock state,
 * unlike expo-screen-orientation which only detects UI orientation changes.
 *
 * Features:
 * - Uses accelerometer/gyroscope to detect physical device orientation
 * - Works even when UI is locked to portrait
 * - Only updates orientation when NOT recording (locks during recording)
 * - Uses 500ms update interval to conserve battery
 *
 * @returns The current device orientation
 */
export function useOrientationDetection(): DeviceOrientation {
  const deviceOrientation = useRecordingStore((s) => s.deviceOrientation);
  const setDeviceOrientation = useRecordingStore((s) => s.setDeviceOrientation);
  const isRecording = useRecordingStore((s) => s.isRecording);

  // Track if we should be updating orientation
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;

  // Track last orientation to avoid unnecessary updates
  const lastOrientationRef = useRef<DeviceOrientation>(deviceOrientation);

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const startListening = async () => {
      try {
        // Check if DeviceMotion is available
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (!isAvailable) {
          console.warn('[useOrientationDetection] DeviceMotion is not available on this device');
          return;
        }

        // Set update interval to 500ms to conserve battery
        DeviceMotion.setUpdateInterval(500);

        // Subscribe to DeviceMotion updates
        subscription = DeviceMotion.addListener((data) => {
          // Only update orientation when NOT recording (lock during recording)
          if (isRecordingRef.current) {
            return;
          }

          // DeviceMotion provides orientation in data.orientation (degrees)
          if (data.orientation !== undefined && data.orientation !== null) {
            const newOrientation = mapMotionOrientation(data.orientation);

            // Only update state if orientation actually changed
            if (newOrientation !== lastOrientationRef.current) {
              lastOrientationRef.current = newOrientation;
              setDeviceOrientation(newOrientation);
            }
          }
        });
      } catch (error) {
        console.warn('[useOrientationDetection] Failed to start DeviceMotion listener:', error);
      }
    };

    startListening();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [setDeviceOrientation]);

  return deviceOrientation;
}

export default useOrientationDetection;
