import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import type { Face } from 'react-native-vision-camera-face-detector';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Worklets } from 'react-native-worklets-core';
import { useKeepAwake } from 'expo-keep-awake';
import { captureRef } from 'react-native-view-shot';
import { Fonts } from '../../constants/Fonts';
import DigicamOverlay from '../../components/DigicamOverlay';
import * as Haptics from '../../lib/haptics';
import * as Timelapse from '../../lib/timelapseModule';
import TimelapsePreviewSheet from '../../components/TimelapsePreviewSheet';

const WORKING_COLOR = '#2563EB';
const PAUSED_COLOR = '#F97316';
const BRAND_PINK = '#FF3B5C';
const EYE_OPEN_THRESHOLD = 0.4;
const CAPTURE_INTERVAL_MS = 12000; // 12 seconds between frames

const IDLE_QUOTES = [
  "ready when you are",
  "tap to lock in",
  "let's get this bread",
  "your villain arc awaits",
  "time to lock in bestie",
];

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
  const [isSessionActive, setIsSessionActive] = useState(false);

  const isForegroundRef = useRef(true);
  const isSessionActiveRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      setIsForeground(active);
      isForegroundRef.current = active;
    });
    return () => subscription.remove();
  }, []);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
  ]);
  const cameraRef = useRef(null);

  const [previewVideoUri, setPreviewVideoUri] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [quote, setQuote] = useState(() => pickRandom(IDLE_QUOTES));

  const isWorkingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraSectionRef = useRef<View>(null);
  const overlayRef = useRef<View>(null);

  // Animated border + glow color
  const borderProgress = useSharedValue(0);
  const frameCounter = useSharedValue(0);

  // Idle pink glow pulse animation
  const idleGlowOpacity = useSharedValue(0.8);

  useEffect(() => {
    if (!isSessionActive) {
      idleGlowOpacity.value = withRepeat(
        withSequence(
          withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      idleGlowOpacity.value = withTiming(1.0, { duration: 200 });
    }
  }, [isSessionActive, idleGlowOpacity]);

  const idleGlowStyle = useAnimatedStyle(() => ({
    opacity: idleGlowOpacity.value,
  }));

  // Active session: animate between working (blue) and paused (orange)
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

  // Static pink style for idle state
  const pinkGlowStyle = {
    borderColor: BRAND_PINK,
    shadowColor: BRAND_PINK,
  };

  // Start timer interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isWorkingRef.current && isSessionActiveRef.current) {
        setElapsedSeconds((prev) => prev + 1);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // Cycle motivational quotes
  useEffect(() => {
    if (!isSessionActive) {
      setQuote(pickRandom(IDLE_QUOTES));
      const id = setInterval(() => setQuote(pickRandom(IDLE_QUOTES)), 10000);
      return () => clearInterval(id);
    }
    const quotes = isWorking ? FOCUSED_QUOTES : PAUSED_QUOTES;
    setQuote(pickRandom(quotes));
    const id = setInterval(() => setQuote(pickRandom(quotes)), 10000);
    return () => clearInterval(id);
  }, [isWorking, isSessionActive]);

  const updateWorkingState = useCallback((working: boolean) => {
    if (working) {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if (isWorkingRef.current) return;
      isWorkingRef.current = true;
      setIsWorking(true);
      borderProgress.value = withTiming(0, { duration: 300 });
    } else {
      if (!isWorkingRef.current) return;
      if (pauseTimeoutRef.current) return;
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

  // Face detection setup
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

  // Timelapse capture function — two-layer capture + native compositing
  const captureFrame = useCallback(async () => {
    if (!cameraRef.current || !overlayRef.current || !isSessionActiveRef.current || !isForegroundRef.current) return;
    try {
      // 1. Capture camera frame via VisionCamera's native pipeline (gets the GPU surface)
      const snapshot = await (cameraRef.current as any).takeSnapshot({ quality: 80 });
      // 2. Capture overlay (digicam UI elements) with transparent background
      const overlayBase64 = await captureRef(overlayRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });
      // 3. Composite natively: camera image + overlay → video frame
      await Timelapse.addCompositeFrame(snapshot.path, overlayBase64);
    } catch (e) {
      console.warn('Timelapse frame capture failed:', e);
    }
  }, []);

  // Session start/stop
  const startSession = useCallback(async () => {
    setIsSessionActive(true);
    isSessionActiveRef.current = true;
    setElapsedSeconds(0);
    Haptics.sessionStart();

    try {
      // Use approximate dimensions for the captured view (3:4 aspect)
      await Timelapse.startRecording(720, 960);

      // Capture first frame immediately
      setTimeout(() => captureFrame(), 500);

      // Start capture interval
      captureIntervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    } catch (e) {
      console.warn('Failed to start timelapse recording:', e);
    }
  }, [captureFrame]);

  const stopSession = useCallback(async () => {
    setIsSessionActive(false);
    isSessionActiveRef.current = false;
    Haptics.sessionStop();

    // Stop capture interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    // Reset face detection state
    isWorkingRef.current = false;
    setIsWorking(false);
    borderProgress.value = withTiming(0, { duration: 300 });

    // Clear any pending pause timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    try {
      const videoPath = await Timelapse.stopRecording();
      if (videoPath) {
        setPreviewVideoUri(videoPath);
        setShowPreview(true);
      }
    } catch (e: any) {
      if (e?.code === 'ERR_EMPTY') {
        // No frames captured, no video to save — that's fine
      } else {
        console.warn('Failed to stop timelapse recording:', e);
      }
    }
  }, [borderProgress]);

  const toggleSession = useCallback(() => {
    if (isSessionActiveRef.current) {
      stopSession();
    } else {
      startSession();
    }
  }, [startSession, stopSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (isSessionActiveRef.current) {
        Timelapse.cancelRecording().catch(() => {});
      }
    };
  }, []);

  // Pause/resume capture when app backgrounds
  useEffect(() => {
    if (!isSessionActive) return;

    if (isForeground) {
      // Resume capture interval
      if (!captureIntervalRef.current) {
        captureIntervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
      }
    } else {
      // Pause capture interval
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    }
  }, [isForeground, isSessionActive, captureFrame]);

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
      <View style={styles.cameraSection} ref={cameraSectionRef} collapsable={false}>
        {isSessionActive ? (
          // Active session: animated blue/orange glow
          <Animated.View style={[styles.cameraGlowOuter, animatedColorStyle]}>
            <Animated.View style={[styles.cameraGlow, animatedColorStyle]}>
              <Animated.View style={[styles.cameraBorder, animatedColorStyle]}>
                <Camera
                  ref={cameraRef}
                  style={styles.camera}
                  device={device}
                  isActive={isForeground}
                  video={true}
                  pixelFormat="yuv"
                  format={format}
                  frameProcessor={frameProcessor}
                />
                <View ref={overlayRef} collapsable={false} style={StyleSheet.absoluteFill}>
                  <DigicamOverlay isWorking={isWorking} elapsedSeconds={elapsedSeconds} />
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        ) : (
          // Idle: static pink glow with breathing pulse
          <Animated.View style={[styles.cameraGlowOuter, pinkGlowStyle, idleGlowStyle]}>
            <Animated.View style={[styles.cameraGlow, pinkGlowStyle]}>
              <Animated.View style={[styles.cameraBorder, pinkGlowStyle]}>
                <Camera
                  ref={cameraRef}
                  style={styles.camera}
                  device={device}
                  isActive={isForeground}
                  video={true}
                  pixelFormat="yuv"
                  format={format}
                />
                <DigicamOverlay isWorking={false} elapsedSeconds={0} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <Text style={styles.timer}>{isSessionActive ? formatTime(elapsedSeconds) : '00:00'}</Text>

      {/* Record / Stop Button */}
      <Pressable onPress={toggleSession} style={styles.recordButtonOuter}>
        {isSessionActive ? (
          // Stop button: pink circle with white square
          <View style={styles.recordButtonActive}>
            <View style={styles.stopSquare} />
          </View>
        ) : (
          // Record button: pink circle with inner pink circle
          <View style={styles.recordButtonIdle}>
            <View style={styles.recordInnerCircle} />
          </View>
        )}
      </Pressable>

      <Text style={styles.motivationalText}>{quote}</Text>

      <TimelapsePreviewSheet
        visible={showPreview}
        videoUri={previewVideoUri}
        onClose={() => setShowPreview(false)}
      />
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
    maxHeight: '55%',
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 20,
  },
  cameraGlow: {
    flex: 1,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 30,
    elevation: 20,
  },
  cameraBorder: {
    flex: 1,
    borderWidth: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  // Record button styles
  recordButtonOuter: {
    marginTop: 16,
    marginBottom: 4,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: BRAND_PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonIdle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND_PINK,
  },
  recordButtonActive: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND_PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
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
