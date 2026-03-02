import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import type { Face } from 'react-native-vision-camera-face-detector';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';
import { Fonts } from '../../constants/Fonts';

const WORKING_COLOR = '#00E676';
const PAUSED_COLOR = '#FF3B5C';
const GRACE_PERIOD_MS = 2000;
const EYE_OPEN_THRESHOLD = 0.4;

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function CameraScreen() {
  useKeepAwake();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorking, setIsWorking] = useState(false);

  const isWorkingRef = useRef(false);
  const lastWorkingTimestamp = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated border color
  const borderProgress = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const r = Math.round(0 + borderProgress.value * (255 - 0));
    const g = Math.round(230 + borderProgress.value * (59 - 230));
    const b = Math.round(118 + borderProgress.value * (92 - 118));
    return {
      borderColor: `rgb(${r}, ${g}, ${b})`,
    };
  });

  // Start timer interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isWorkingRef.current) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateWorkingState = useCallback((working: boolean) => {
    if (working === isWorkingRef.current) return;
    isWorkingRef.current = working;
    setIsWorking(working);
    borderProgress.value = withTiming(working ? 0 : 1, { duration: 300 });
  }, [borderProgress]);

  const handleFacesDetected = useCallback((faces: Face[]) => {
    const now = Date.now();

    if (faces.length > 0) {
      const face = faces[0];
      const eyesOpen =
        face.leftEyeOpenProbability > EYE_OPEN_THRESHOLD &&
        face.rightEyeOpenProbability > EYE_OPEN_THRESHOLD;

      if (eyesOpen) {
        lastWorkingTimestamp.current = now;
        updateWorkingState(true);
        return;
      }
    }

    // Not working — apply grace period
    if (
      isWorkingRef.current &&
      now - lastWorkingTimestamp.current < GRACE_PERIOD_MS
    ) {
      return; // Still within grace period
    }

    updateWorkingState(false);
  }, [updateWorkingState]);

  // Permission not yet granted
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          LockIn needs camera access to detect when you're focused and track your work sessions.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  // No camera device
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionTitle}>No Camera Found</Text>
        <Text style={styles.permissionText}>
          Could not find a front-facing camera on this device.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraSection}>
        <Animated.View style={[styles.cameraBorder, animatedBorderStyle]}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            faceDetectionOptions={{
              performanceMode: 'fast',
              classificationMode: 'all',
              cameraFacing: 'front',
            }}
            faceDetectionCallback={handleFacesDetected}
          />
        </Animated.View>
      </View>

      <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isWorking ? WORKING_COLOR : PAUSED_COLOR },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            { color: isWorking ? WORKING_COLOR : PAUSED_COLOR },
          ]}
        >
          {isWorking ? 'Focused' : 'Paused'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cameraSection: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: '60%',
    marginBottom: 32,
  },
  cameraBorder: {
    flex: 1,
    borderWidth: 4,
    borderRadius: 20,
    borderColor: PAUSED_COLOR,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  timer: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 18,
    fontFamily: Fonts.medium,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FF3B5C',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
  },
});
