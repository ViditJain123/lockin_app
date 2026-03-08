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
import { sendSessionEvent } from '../../lib/tinybird';
import { useAuth } from '../../contexts/AuthContext';
import { useRecordingStore } from '../../store/useRecordingStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useProfileStatsStore } from '../../store/useProfileStatsStore';
import { useVideoGalleryStore } from '../../store/useVideoGalleryStore';
import { useAppLockStore } from '../../store/useAppLockStore';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'expo-router';
import { getLocalDateString } from '../../lib/dateUtils';
import { SESSION_DEV_MODE_ENABLED } from '../../lib/config';

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
  const router = useRouter();
  const { user } = useAuth();
  const setIsSessionActiveGlobal = useRecordingStore((s) => s.setIsSessionActive);

  const [isForeground, setIsForeground] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const isForegroundRef = useRef(true);
  const isSessionActiveRef = useRef(false);

  // Session tracking refs
  const sessionStartTimeRef = useRef<Date | null>(null);
  const distractionCountRef = useRef(0);
  const distractedSecondsRef = useRef(0);
  const distractedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasDistractedRef = useRef(false);

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
      wasDistractedRef.current = false;
      setIsWorking(true);
      borderProgress.value = withTiming(0, { duration: 300 });

      // Stop counting distracted time
      if (distractedTimerRef.current) {
        clearInterval(distractedTimerRef.current);
        distractedTimerRef.current = null;
      }
    } else {
      if (!isWorkingRef.current) return;
      if (pauseTimeoutRef.current) return;
      pauseTimeoutRef.current = setTimeout(() => {
        pauseTimeoutRef.current = null;
        isWorkingRef.current = false;
        setIsWorking(false);
        borderProgress.value = withTiming(1, { duration: 300 });

        // Count this as a new distraction event
        if (isSessionActiveRef.current && !wasDistractedRef.current) {
          wasDistractedRef.current = true;
          distractionCountRef.current += 1;
        }

        // Start counting distracted time
        if (isSessionActiveRef.current && !distractedTimerRef.current) {
          distractedTimerRef.current = setInterval(() => {
            if (!isWorkingRef.current && isSessionActiveRef.current) {
              distractedSecondsRef.current += 1;
            }
          }, 1000);
        }
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
    setIsSessionActiveGlobal(true);
    setElapsedSeconds(0);
    Haptics.sessionStart();

    // Reset session tracking
    sessionStartTimeRef.current = new Date();
    distractionCountRef.current = 0;
    distractedSecondsRef.current = 0;
    wasDistractedRef.current = false;

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
  }, [captureFrame, setIsSessionActiveGlobal]);

  const stopSession = useCallback(async () => {
    const sessionEndTime = new Date();
    const sessionStartTime = sessionStartTimeRef.current || sessionEndTime;
    const lockedInSeconds = elapsedSeconds;
    const distractedSeconds = distractedSecondsRef.current;
    const distractionCount = distractionCountRef.current;

    setIsSessionActive(false);
    isSessionActiveRef.current = false;
    setIsSessionActiveGlobal(false);
    Haptics.sessionStop();

    // Stop distracted timer
    if (distractedTimerRef.current) {
      clearInterval(distractedTimerRef.current);
      distractedTimerRef.current = null;
    }

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

    // Generate a single session ID for both local and Tinybird
    const sessionId = uuidv4();
    const dateStr = getLocalDateString(sessionStartTime);

    // Store session locally first (local-first)
    const sessionData = {
      session_id: sessionId,
      date: dateStr,
      total_locked_in_seconds: lockedInSeconds,
      total_distracted_seconds: distractedSeconds,
      distraction_count: distractionCount,
      created_at: sessionEndTime.toISOString(),
      time_started: sessionStartTime.toISOString(),
      time_ended: sessionEndTime.toISOString(),
    };
    console.log('[StopSession] Adding session:', sessionData);
    useSessionStore.getState().addSession(sessionData);

    // Credit earned screen time (4:1 ratio)
    useAppLockStore.getState().creditEarnedTime(lockedInSeconds);

    // Recompute profile stats from local data
    useProfileStatsStore.getState().recomputeFromSessions();

    const statsAfter = useProfileStatsStore.getState();
    console.log('[StopSession] Stats after recompute:', {
      total_hours: statsAfter.total_hours,
      grinds: statsAfter.grinds,
      streak: statsAfter.streak,
    });

    // Send to Tinybird as backup (fire-and-forget)
    const tinybirdPayload = {
      session_id: sessionId,
      user_id: user?.id ?? 'anonymous',
      date: dateStr,
      time_started: sessionStartTime.toISOString(),
      time_ended: sessionEndTime.toISOString(),
      distraction_count: distractionCount,
      total_locked_in_seconds: lockedInSeconds,
      total_distracted_seconds: distractedSeconds,
      timestamp: sessionEndTime.toISOString(),
    };
    console.log('[StopSession] Sending to Tinybird:', tinybirdPayload);
    sendSessionEvent(tinybirdPayload).catch((err) => {
      console.warn('[StopSession] Tinybird send FAILED:', err);
    });

    try {
      const videoPath = await Timelapse.stopRecording();
      if (videoPath) {
        // Move video from cache to permanent Documents storage
        const docsDir = FileSystem.documentDirectory + 'timelapses/';
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        const filename = videoPath.split('/').pop()!;
        const permanentUri = docsDir + filename;
        await FileSystem.moveAsync({ from: videoPath, to: permanentUri });

        // Generate thumbnail and save to permanent storage
        let thumbnailRelPath: string | null = null;
        const recordingId = sessionId;
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(permanentUri, { time: 0 });
          const thumbsDir = FileSystem.documentDirectory + 'thumbnails/';
          await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
          const thumbFilename = recordingId + '.jpg';
          await FileSystem.copyAsync({ from: thumb.uri, to: thumbsDir + thumbFilename });
          thumbnailRelPath = 'thumbnails/' + thumbFilename;
        } catch {
          // Thumbnail generation failed, continue without it
        }

        // Store relative paths (strip documentDirectory prefix)
        const videoRelPath = 'timelapses/' + filename;

        // Persist metadata
        useVideoGalleryStore.getState().addRecording({
          id: recordingId,
          videoUri: videoRelPath,
          thumbnailUri: thumbnailRelPath,
          sessionDurationSeconds: lockedInSeconds + distractedSeconds,
          createdAt: new Date().toISOString(),
        });

        setPreviewVideoUri(permanentUri);
        setShowPreview(true);

        router.push({
          pathname: '/grind-complete',
          params: {
            videoUri: permanentUri,
            grindDurationSeconds: String(lockedInSeconds + distractedSeconds),
          },
        });
      }
    } catch (e: any) {
      if (e?.code === 'ERR_EMPTY') {
        // No frames captured, no video to save — that's fine
      } else {
        console.warn('Failed to stop timelapse recording:', e);
      }
    }
  }, [borderProgress, elapsedSeconds, user, setIsSessionActiveGlobal, router]);

  const simulateSession = useCallback(() => {
    const now = new Date();
    const sessionId = uuidv4();
    const dateStr = getLocalDateString(now);
    const lockedInSeconds = 240; // 4 minutes
    const distractedSeconds = 30;
    const distractionCount = 2;
    const totalSeconds = lockedInSeconds + distractedSeconds;

    const timeStarted = new Date(now.getTime() - totalSeconds * 1000);

    const sessionData = {
      session_id: sessionId,
      date: dateStr,
      total_locked_in_seconds: lockedInSeconds,
      total_distracted_seconds: distractedSeconds,
      distraction_count: distractionCount,
      created_at: now.toISOString(),
      time_started: timeStarted.toISOString(),
      time_ended: now.toISOString(),
    };
    useSessionStore.getState().addSession(sessionData);
    useAppLockStore.getState().creditEarnedTime(lockedInSeconds);
    useProfileStatsStore.getState().recomputeFromSessions();

    // Send to Tinybird (fire-and-forget)
    sendSessionEvent({
      session_id: sessionId,
      user_id: user?.id ?? 'anonymous',
      date: dateStr,
      time_started: timeStarted.toISOString(),
      time_ended: now.toISOString(),
      distraction_count: distractionCount,
      total_locked_in_seconds: lockedInSeconds,
      total_distracted_seconds: distractedSeconds,
      timestamp: now.toISOString(),
    }).catch((err) => console.warn('[DevSession] Tinybird send failed:', err));

    router.push({
      pathname: '/grind-complete',
      params: { grindDurationSeconds: String(totalSeconds) },
    });
  }, [user, router]);

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
      if (distractedTimerRef.current) {
        clearInterval(distractedTimerRef.current);
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
      <View style={styles.buttonRow}>
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
        {SESSION_DEV_MODE_ENABLED && !isSessionActive && (
          <Pressable onPress={simulateSession} style={styles.devButton}>
            <Text style={styles.devButtonText}>Dev</Text>
          </Pressable>
        )}
      </View>

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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  devButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  devButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
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
