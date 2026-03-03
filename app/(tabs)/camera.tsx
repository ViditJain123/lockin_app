import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import type { Face } from 'react-native-vision-camera-face-detector';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';
import { useKeepAwake } from 'expo-keep-awake';
import { Fonts } from '../../constants/Fonts';
import DigicamOverlay from '../../components/DigicamOverlay';

const WORKING_COLOR = '#2563EB';
const PAUSED_COLOR = '#F97316';
const EYE_OPEN_THRESHOLD = 0.4;

const FOCUSED_QUOTES = [
  "you're locked in rn fr fr",
  "main character energy",
  "no thoughts just grind",
  "this is your villain arc",
  "slay the work bestie",
  "serving focus realness",
  "literally unstoppable",
  "the grind never lies",
  "built different tbh",
  "giving academic weapon",
];

const PAUSED_QUOTES = [
  "bro come back",
  "the screen misses you",
  "this is not very slay",
  "ur giving quitter vibes",
  "hello?? we had a deal",
  "the grind doesn't pause itself",
  "not you leaving mid-sesh",
  "bestie this ain't it",
  "you fell off ngl",
  "main characters don't quit",
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsForeground(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
  ]);
  const cameraRef = useRef(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [quote, setQuote] = useState(() => pickRandom(PAUSED_QUOTES));

  const isWorkingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated border + glow color (consolidated to avoid duplicate RGB math at 60fps)
  const borderProgress = useSharedValue(0);
  const frameCounter = useSharedValue(0);

  const animatedColorStyle = useAnimatedStyle(() => {
    const r = Math.round(37 + borderProgress.value * (249 - 37));
    const g = Math.round(99 + borderProgress.value * (115 - 99));
    const b = Math.round(235 + borderProgress.value * (22 - 235));
    const color = `rgb(${r}, ${g}, ${b})`;
    return {
      borderColor: color,
      shadowColor: color,
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
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // Cycle motivational quote on focus state change + every 10s
  useEffect(() => {
    const quotes = isWorking ? FOCUSED_QUOTES : PAUSED_QUOTES;
    setQuote(pickRandom(quotes));
    const id = setInterval(() => setQuote(pickRandom(quotes)), 10000);
    return () => clearInterval(id);
  }, [isWorking]);

  const updateWorkingState = useCallback((working: boolean) => {
    if (working) {
      // Resume instantly — clear any pending pause
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if (isWorkingRef.current) return;
      isWorkingRef.current = true;
      setIsWorking(true);
      borderProgress.value = withTiming(0, { duration: 300 });
    } else {
      // Pause with 300ms grace period (absorbs blinks)
      if (!isWorkingRef.current) return;
      if (pauseTimeoutRef.current) return; // already scheduled
      pauseTimeoutRef.current = setTimeout(() => {
        pauseTimeoutRef.current = null;
        isWorkingRef.current = false;
        setIsWorking(false);
        borderProgress.value = withTiming(1, { duration: 300 });
      }, 300);
    }
  }, [borderProgress]);

  const handleFacesDetected = useCallback((faces: Face[]) => {
    if (faces.length > 0) {
      const face = faces[0];
      const eyesOpen =
        face.leftEyeOpenProbability > EYE_OPEN_THRESHOLD &&
        face.rightEyeOpenProbability > EYE_OPEN_THRESHOLD;

      updateWorkingState(eyesOpen);
    } else {
      updateWorkingState(false);
    }
  }, [updateWorkingState]);

  // Face detection setup (no Skia dependency)
  const faceDetectionOptions = useMemo(() => ({
    performanceMode: 'fast' as const,
    classificationMode: 'all' as const,
    cameraFacing: 'front' as const,
  }), []);

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  const runOnJS = useMemo(
    () => Worklets.createRunOnJS(handleFacesDetected),
    [handleFacesDetected]
  );

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    frameCounter.value = frameCounter.value + 1;
    if (frameCounter.value % 5 !== 0) return;
    const faces = detectFaces(frame);
    runOnJS(faces);
  }, [detectFaces, runOnJS, frameCounter]);

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
        <Animated.View style={[styles.cameraGlowOuter, animatedColorStyle]}>
        <Animated.View style={[styles.cameraGlow, animatedColorStyle]}>
          <Animated.View style={[styles.cameraBorder, animatedColorStyle]}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={isForeground}
              pixelFormat="yuv"
              format={format}
              frameProcessor={frameProcessor}
            />
            <DigicamOverlay isWorking={isWorking} elapsedSeconds={elapsedSeconds} />
          </Animated.View>
        </Animated.View>
        </Animated.View>
      </View>

      <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      <Text style={styles.motivationalText}>{quote}</Text>
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
    maxHeight: '65%',
    marginBottom: 24,
  },
  timer: {
    fontSize: 48,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  motivationalText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  cameraGlowOuter: {
    flex: 1,
    borderRadius: 20,
    shadowColor: PAUSED_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  cameraGlow: {
    flex: 1,
    borderRadius: 20,
    shadowColor: PAUSED_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 30,
    elevation: 20,
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
    backgroundColor: '#2563EB',
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
