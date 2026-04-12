import { useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { DeviceOrientation, useRecordingStore } from '@/store/useRecordingStore';

function mapMotionOrientation(orientationDegrees: number): DeviceOrientation {
  if (orientationDegrees >= -135 && orientationDegrees < -45) {
    return 'landscape-left';
  } else if (orientationDegrees >= 45 && orientationDegrees < 135) {
    return 'landscape-right';
  } else {
    return 'portrait';
  }
}

export function useOrientationDetection(): DeviceOrientation {
  const deviceOrientation = useRecordingStore((s) => s.deviceOrientation);
  const setDeviceOrientation = useRecordingStore((s) => s.setDeviceOrientation);
  const isSessionActive = useRecordingStore((s) => s.isSessionActive);

  const isRecordingRef = useRef(isSessionActive);
  isRecordingRef.current = isSessionActive;

  const lastOrientationRef = useRef<DeviceOrientation>(deviceOrientation);

  useEffect(() => {
    let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

    const startListening = async () => {
      try {
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (!isAvailable) return;

        DeviceMotion.setUpdateInterval(500);

        subscription = DeviceMotion.addListener((data) => {
          // Freeze orientation during recording
          if (isRecordingRef.current) return;

          if (data.orientation !== undefined && data.orientation !== null) {
            const newOrientation = mapMotionOrientation(data.orientation);
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

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [setDeviceOrientation]);

  return deviceOrientation;
}

export default useOrientationDetection;
