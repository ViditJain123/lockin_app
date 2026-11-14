import CountdownOverlay from '@/components/CountdownOverlay';
import { DraggableTimerPlaceholder } from '@/components/DraggableTimerPlaceholder';
import GlassIconButton from '@/components/GlassIconButton';
import { formatHM } from '@/components/dashboard/TodayCard';
import SessionToast from '@/components/session/SessionToast';
import ShutterButton from '@/components/session/ShutterButton';
import { useSessionMilestones } from '@/components/session/useSessionMilestones';
import ShortTimelapseWarningModal from '@/components/ShortTimelapseWarningModal';
import TimelapsePreviewSheet from '@/components/TimelapsePreviewSheet';
import { T } from '@/constants/Theme';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { SESSION_DEV_MODE_ENABLED } from '@/lib/config';
import { getLocalDateString } from '@/lib/dateUtils';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';
import { playSound } from '@/lib/sound';
import * as Timelapse from '@/lib/timelapseModule';
import { sendSessionEvent } from '@/lib/tinybird';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useOrientationDetection } from '@/hooks/useOrientationDetection';
import { useRecordingStore } from '@/store/useRecordingStore';
import { useSessionStore } from '@/store/useSessionStore';
import {
  flushGallery,
  PENDING_RECORDING_KEY,
  useVideoGalleryStore,
} from '@/store/useVideoGalleryStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Adaptive capture cadence: fast at the start, gradually slowing as the session runs.
// The native module (TimelapseModule) buffers frames on disk and time-bucket-decimates
// when the buffer exceeds its cap, picking one frame per equal-time slice. That makes
// the final video uniform in real time regardless of which schedule tier produced each frame.
const CAPTURE_SCHEDULE: ReadonlyArray<{ untilSeconds: number; intervalMs: number }> = [
  { untilSeconds: 30,       intervalMs: 250 },    // 0-30s      @ 4 fps
  { untilSeconds: 120,      intervalMs: 500 },    // 30s-2min   @ 2 fps
  { untilSeconds: 600,      intervalMs: 1500 },   // 2-10min    @ ~0.67 fps
  { untilSeconds: 1800,     intervalMs: 4000 },   // 10-30min   @ 0.25 fps
  { untilSeconds: Infinity, intervalMs: 10000 },  // 30min+     @ 0.1 fps
];
function captureIntervalFor(elapsedSeconds: number): number {
  for (const step of CAPTURE_SCHEDULE) {
    if (elapsedSeconds < step.untilSeconds) return step.intervalMs;
  }
  return CAPTURE_SCHEDULE[CAPTURE_SCHEDULE.length - 1].intervalMs;
}
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CameraScreen() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Camera state
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const cameraRef = useRef<CameraView>(null);

  // Layout state
  const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0, top: 0, left: 0 });

  // Recording state from store
  const isSessionActive = useRecordingStore((s) => s.isSessionActive);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);
  const timerPosition = useRecordingStore((s) => s.timerPosition);
  const timerFilter = useRecordingStore((s) => s.timerFilter);
  const timerScale = useRecordingStore((s) => s.timerScale);
  const setIsSessionActive = useRecordingStore((s) => s.setIsSessionActive);
  const setIsPreparing = useRecordingStore((s) => s.setIsPreparing);
  const setIsFinishing = useRecordingStore((s) => s.setIsFinishing);
  const setIsCountingDown = useRecordingStore((s) => s.setIsCountingDown);
  const setTimerPosition = useRecordingStore((s) => s.setTimerPosition);
  const setTimerFilter = useRecordingStore((s) => s.setTimerFilter);
  const setTimerScale = useRecordingStore((s) => s.setTimerScale);

  // Device orientation detection (freezes during recording)
  const deviceOrientation = useOrientationDetection();

  // Short warning modal
  const [showShortWarning, setShowShortWarning] = useState(false);

  // Timelapse preview sheet (shown after a session finishes, before grind-complete)
  const [previewUri, setPreviewUri] = useState('');
  const [previewDuration, setPreviewDuration] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const pendingGrindCompleteParamsRef = useRef<Record<string, string> | null>(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedSecondsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const isSessionActiveRef = useRef(false);
  const isForegroundRef = useRef(true);

  // Track foreground/background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      isForegroundRef.current = active;
    });
    return () => subscription.remove();
  }, []);

  // Timer interval - counts every second while session is active
  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        elapsedSecondsRef.current += 1;
        setElapsedSeconds(elapsedSecondsRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSessionActive]);

  // Timelapse frame capture
  const captureFrame = useCallback(async () => {
    if (!cameraRef.current || !isSessionActiveRef.current || !isForegroundRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: true,
        shutterSound: false,
      });
      if (photo?.base64) {
        await Timelapse.addFrame(photo.base64, elapsedSecondsRef.current);
      }
    } catch (e) {
      console.warn('Timelapse frame capture failed:', e);
    }
  }, []);

  // Adaptive-cadence capture loop: each tick captures a frame then schedules the next
  // tick based on the current elapsed time, re-reading `captureIntervalFor` every time
  // so the interval grows as the session runs long.
  const runCaptureLoop = useCallback(() => {
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
    const tick = async () => {
      if (!isSessionActiveRef.current || !isForegroundRef.current) {
        captureTimeoutRef.current = null;
        return;
      }
      await captureFrame();
      if (!isSessionActiveRef.current || !isForegroundRef.current) {
        captureTimeoutRef.current = null;
        return;
      }
      const delay = captureIntervalFor(elapsedSecondsRef.current);
      captureTimeoutRef.current = setTimeout(tick, delay);
    };
    tick();
  }, [captureFrame]);

  // Pause/resume capture when app backgrounds
  useEffect(() => {
    if (!isSessionActive) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!captureTimeoutRef.current && isSessionActiveRef.current) {
          runCaptureLoop();
        }
      } else {
        if (captureTimeoutRef.current) {
          clearTimeout(captureTimeoutRef.current);
          captureTimeoutRef.current = null;
        }
      }
    });
    return () => subscription.remove();
  }, [isSessionActive, runCaptureLoop]);

  // Start session
  const startSession = useCallback(async () => {
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    sessionStartTimeRef.current = new Date();
    isSessionActiveRef.current = true;
    setIsSessionActive(true);

    // The countdown already played the lock-in sound + haptic pattern
    posthog.capture('session_started');

    try {
      const isLandscape = deviceOrientation !== 'portrait';
      const videoWidth = isLandscape ? 1920 : 1080;
      const videoHeight = isLandscape ? 1080 : 1920;
      const pendingDir = await Timelapse.startRecording(
        videoWidth, videoHeight, deviceOrientation,
        timerPosition.x, timerPosition.y, timerFilter, timerScale
      );
      // Persist a descriptor of this in-flight session. If the app crashes
      // mid-recording, startup recovery in useVideoGalleryStore will read
      // this key and call finalizePendingRecording on pendingDir.
      if (pendingDir) {
        try {
          await AsyncStorage.setItem(
            PENDING_RECORDING_KEY,
            JSON.stringify({
              pendingDir,
              startedAt: (sessionStartTimeRef.current ?? new Date()).toISOString(),
              taskName: '',
            })
          );
        } catch (err) {
          console.warn('[Session] Failed to persist pending descriptor:', err);
        }
      }
      // Small warmup delay lets the camera finish exposure ramp before the first frame,
      // then the adaptive loop takes over.
      setTimeout(() => runCaptureLoop(), 500);
    } catch (e) {
      console.warn('Failed to start timelapse recording:', e);
      posthog.capture('timelapse_start_failed', {
        error: (e as Error)?.message ?? String(e),
      });
    }
  }, [runCaptureLoop, setIsSessionActive, deviceOrientation, timerPosition, timerFilter, timerScale]);

  // Stop session
  const stopSession = useCallback(async (skipPreview: boolean = false) => {
    const sessionEndTime = new Date();
    const sessionStartTime = sessionStartTimeRef.current || sessionEndTime;
    const lockedInSeconds = elapsedSecondsRef.current;

    isSessionActiveRef.current = false;
    setIsSessionActive(false);
    setIsFinishing(true);

    playSound('unlock');
    Haptics.unlockPattern();

    // Stop adaptive capture loop
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }

    // Generate session ID
    const sessionId = uuidv4();
    const dateStr = getLocalDateString(sessionStartTime);

    // Store session locally first (local-first)
    useSessionStore.getState().addSession({
      session_id: sessionId,
      date: dateStr,
      total_locked_in_seconds: lockedInSeconds,
      created_at: sessionEndTime.toISOString(),
      time_started: sessionStartTime.toISOString(),
      time_ended: sessionEndTime.toISOString(),
    });

    posthog.capture('session_completed', {
      locked_in_seconds: lockedInSeconds,
      duration_seconds: Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000),
    });

    // Credit earned screen time (4:1 ratio)
    useAppLockStore.getState().creditEarnedTime(lockedInSeconds);

    // Recompute profile stats
    useProfileStatsStore.getState().recomputeFromSessions(user?.id);

    // Send to Tinybird (fire-and-forget)
    sendSessionEvent({
      session_id: sessionId,
      user_id: user?.id ?? 'anonymous',
      date: dateStr,
      time_started: sessionStartTime.toISOString(),
      time_ended: sessionEndTime.toISOString(),
      total_locked_in_seconds: lockedInSeconds,
      timestamp: sessionEndTime.toISOString(),
    }).catch((err) => {
      console.warn('[StopSession] Tinybird send FAILED:', err);
    });

    // Process timelapse video. Each step is breadcrumbed to PostHog so we can
    // correlate any future crash to exactly which phase failed. The native
    // module now writes the .mp4 straight into Documents/timelapses/, so we
    // no longer need a JS-side moveAsync.
    let videoPath: string | null = null;
    try {
      videoPath = await Timelapse.stopRecording(lockedInSeconds, '');
      posthog.capture('timelapse_save_step', { step: 'encode', sessionId, success: true });
    } catch (e: any) {
      const code = e?.code ?? 'UNKNOWN';
      posthog.capture('timelapse_save_step', {
        step: 'encode',
        sessionId,
        success: false,
        error: code,
      });
      setIsFinishing(false);
      if (code !== 'ERR_EMPTY') {
        console.warn('Failed to stop timelapse recording:', e);
        Alert.alert(
          'Video encoding failed',
          "We couldn't finalize your timelapse this time, but your session was saved. Please try again."
        );
      }
      try { await AsyncStorage.removeItem(PENDING_RECORDING_KEY); } catch {}
      return;
    }

    if (!videoPath) {
      setIsFinishing(false);
      try { await AsyncStorage.removeItem(PENDING_RECORDING_KEY); } catch {}
      return;
    }

    // Integrity check: the native module guarantees the file is in Documents
    // and playable on success, but we still verify size>0 as a last line of
    // defense before we advertise the video to the rest of the app.
    let fileInfo: FileSystem.FileInfo | null = null;
    try {
      fileInfo = await FileSystem.getInfoAsync(videoPath, { size: true } as any);
    } catch {}
    if (!fileInfo?.exists || !(((fileInfo as any).size ?? 0) > 0)) {
      posthog.capture('timelapse_save_step', {
        step: 'integrity',
        sessionId,
        success: false,
        path: videoPath,
      });
      setIsFinishing(false);
      try { await AsyncStorage.removeItem(PENDING_RECORDING_KEY); } catch {}
      Alert.alert(
        'Video file missing',
        "We couldn't find your timelapse file after encoding. We'll try to recover it next time you open the app."
      );
      return;
    }

    const filename = videoPath.split('/').pop()!;
    const permanentUri = videoPath; // native module writes directly to Documents/timelapses/

    // Thumbnail generation. Non-fatal — gallery entry still gets created
    // without a thumbnail, and regenerateMissingThumbnails retries on launch.
    let thumbnailRelPath: string | null = null;
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(permanentUri, { time: 0 });
      const thumbsDir = FileSystem.documentDirectory + 'thumbnails/';
      await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
      const thumbFilename = sessionId + '.jpg';
      await FileSystem.copyAsync({ from: thumb.uri, to: thumbsDir + thumbFilename });
      thumbnailRelPath = 'thumbnails/' + thumbFilename;
      posthog.capture('timelapse_save_step', { step: 'thumbnail', sessionId, success: true });
    } catch (err: any) {
      posthog.capture('timelapse_save_step', {
        step: 'thumbnail',
        sessionId,
        success: false,
        error: err?.message ?? String(err),
      });
    }

    // Persist recording metadata to the in-memory store...
    try {
      useVideoGalleryStore.getState().addRecording({
        id: sessionId,
        type: 'timelapse',
        videoUri: 'timelapses/' + filename,
        thumbnailUri: thumbnailRelPath,
        sessionDurationSeconds: lockedInSeconds,
        createdAt: new Date().toISOString(),
      });
      posthog.capture('timelapse_save_step', { step: 'addRecording', sessionId, success: true });
    } catch (err: any) {
      posthog.capture('timelapse_save_step', {
        step: 'addRecording',
        sessionId,
        success: false,
        error: err?.message ?? String(err),
      });
    }

    // ...and explicitly flush the persisted state to AsyncStorage before
    // navigating away. Zustand persist writes async on state changes and
    // doesn't expose a promise to await, so a crash in the ms after
    // addRecording could lose the metadata. The orphan scanner is the belt;
    // flushGallery is the suspenders.
    try {
      await flushGallery();
      posthog.capture('timelapse_save_step', { step: 'flush', sessionId, success: true });
    } catch (err: any) {
      posthog.capture('timelapse_save_step', {
        step: 'flush',
        sessionId,
        success: false,
        error: err?.message ?? String(err),
      });
    }

    // The session is fully persisted on disk — clear the pending descriptor
    // so startup recovery doesn't try to re-finalize it.
    try { await AsyncStorage.removeItem(PENDING_RECORDING_KEY); } catch {}

    setIsFinishing(false);

    const grindCompleteParams: Record<string, string> = {
      videoUri: permanentUri,
      grindDurationSeconds: String(lockedInSeconds),
      lockedInSeconds: String(lockedInSeconds),
    };

    if (skipPreview) {
      router.push({ pathname: '/grind-complete', params: grindCompleteParams } as any);
    } else {
      // Show the same preview sheet used on the profile page, then navigate to
      // grind-complete once the user dismisses it.
      pendingGrindCompleteParamsRef.current = grindCompleteParams;
      setPreviewUri(permanentUri);
      setPreviewDuration(lockedInSeconds);
      setShowPreview(true);
    }
  }, [user, setIsSessionActive, setIsFinishing, router]);

  // Dev simulate session
  const simulateSession = useCallback(() => {
    const now = new Date();
    const sessionId = uuidv4();
    const dateStr = getLocalDateString(now);
    const lockedInSeconds = 240;
    const timeStarted = new Date(now.getTime() - lockedInSeconds * 1000);

    useSessionStore.getState().addSession({
      session_id: sessionId,
      date: dateStr,
      total_locked_in_seconds: lockedInSeconds,
      created_at: now.toISOString(),
      time_started: timeStarted.toISOString(),
      time_ended: now.toISOString(),
    });
    useAppLockStore.getState().creditEarnedTime(lockedInSeconds);
    useProfileStatsStore.getState().recomputeFromSessions(user?.id);

    sendSessionEvent({
      session_id: sessionId,
      user_id: user?.id ?? 'anonymous',
      date: dateStr,
      time_started: timeStarted.toISOString(),
      time_ended: now.toISOString(),
      total_locked_in_seconds: lockedInSeconds,
      timestamp: now.toISOString(),
    }).catch((err) => console.warn('[DevSession] Tinybird send failed:', err));

    router.push({
      pathname: '/grind-complete',
      params: {
        grindDurationSeconds: String(lockedInSeconds),
        lockedInSeconds: String(lockedInSeconds),
      },
    } as any);
  }, [user, router]);

  // Close preview sheet and continue to the grind-complete screen
  const handlePreviewClose = useCallback(() => {
    const params = pendingGrindCompleteParamsRef.current;
    pendingGrindCompleteParamsRef.current = null;
    setShowPreview(false);
    if (params) {
      router.push({ pathname: '/grind-complete', params } as any);
    }
  }, [router]);

  // Tap the shutter: 3-2-1 countdown, then recording starts
  const handleStartPress = useCallback(() => {
    if (isPreparing || isFinishing || isCountingDown || isSessionActive) return;
    setIsCountingDown(true);
  }, [isSessionActive, isPreparing, isFinishing, isCountingDown, setIsCountingDown]);

  // Hold the shutter to the end of the ring: stop and save
  const handleStopHold = useCallback(async () => {
    if (!isSessionActive || isFinishing) return;
    if (elapsedSecondsRef.current < 60) {
      // Stop recording first so video is saved, then show warning.
      // Skip the preview sheet — the warning already communicates the issue.
      await stopSession(true);
      setShowShortWarning(true);
      return;
    }
    await stopSession(false);
  }, [isSessionActive, isFinishing, stopSession]);

  const { toast, setToast, goalProgress, todayMinutes, goalMinutes } = useSessionMilestones(
    elapsedSeconds,
    isSessionActive
  );

  // Countdown complete - start recording
  const handleCountdownComplete = useCallback(async () => {
    setIsCountingDown(false);
    await startSession();
  }, [startSession, setIsCountingDown]);

  // Toggle camera facing
  const toggleCameraFacing = useCallback(() => {
    if (isSessionActive) return;
    setFacing(facing === 'back' ? 'front' : 'back');
  }, [isSessionActive, facing]);

  // Toggle filter type
  const handleFilterToggle = useCallback(() => {
    setTimerFilter(timerFilter === 'minimal' ? 'dateStamp' : 'minimal');
  }, [timerFilter, setTimerFilter]);

  // Handle container layout
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerLayout({ width, height });

    // Preview always fills full screen width. Vertical space is whatever's left
    // between the exit-button reservation up top and the bottom controls strip.
    const reservedTop = insets.top + 8;
    const reservedBottom = insets.bottom + 168;
    const availableHeight = height - reservedTop - reservedBottom;

    setPreviewLayout({
      width: width - 16,
      height: availableHeight,
      top: reservedTop,
      left: 8,
    });
  }, [insets.top, insets.bottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      if (isSessionActiveRef.current) {
        Timelapse.cancelRecording().catch(() => {});
        AsyncStorage.removeItem(PENDING_RECORDING_KEY).catch(() => {});
      }
    };
  }, []);

  // Loading state
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#0E0E0E', '#1A1A1A']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#0E0E0E', '#1A1A1A']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to capture time-lapse videos.
          </Text>
          <GlassIconButton
            icon="camera"
            size={64}
            iconSize={28}
            onPress={requestPermission}
          />
          <Text style={styles.permissionHint}>Tap to enable camera</Text>
        </View>
      </View>
    );
  }

  const canExit = !isSessionActive && !isPreparing && !isFinishing && !isCountingDown;
  const recording = isSessionActive || isFinishing;
  const earnedMin = Math.floor(elapsedSeconds / 60);
  const goalLeft = Math.max(0, goalMinutes - todayMinutes);

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <StatusBar barStyle="light-content" backgroundColor="#0E0E0E" />

      {/* Camera preview — rounded card */}
      <View style={[styles.previewContainer, {
        width: previewLayout.width,
        height: previewLayout.height,
        top: previewLayout.top,
        left: previewLayout.left,
      }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
        />

        {/* Soft top/bottom scrims keep the chrome legible on bright scenes */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
          style={styles.scrimTop}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
          style={styles.scrimBottom}
        />

        {/* Rule-of-thirds grid while framing */}
        {!recording && [0.333, 0.667].map((p) => (
          <View key={`h${p}`} pointerEvents="none" style={[styles.gridLineH, { top: `${p * 100}%` }]} />
        ))}
        {!recording && [0.333, 0.667].map((p) => (
          <View key={`v${p}`} pointerEvents="none" style={[styles.gridLineV, { left: `${p * 100}%` }]} />
        ))}

        {/* Recording frame glow */}
        {recording && <View pointerEvents="none" style={styles.recFrame} />}
      </View>

      {/* Draggable watermark / timer stamp burned into the video */}
      {containerLayout.width > 0 && previewLayout.height > 0 && (
        <DraggableTimerPlaceholder
          containerWidth={previewLayout.width}
          containerHeight={previewLayout.height}
          containerTop={previewLayout.top}
          containerLeft={previewLayout.left}
          position={timerPosition}
          onPositionChange={setTimerPosition}
          enabled={!isSessionActive && !isPreparing && !isFinishing && !isCountingDown}
          orientation={deviceOrientation}
          filterType={timerFilter}
          onFilterToggle={handleFilterToggle}
          timerScale={timerScale}
          onScaleChange={setTimerScale}
          isRecording={isSessionActive}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* Top chrome over the preview */}
      <View style={[styles.topBar, { top: previewLayout.top + 14 }]}>
        <View style={styles.topSide}>
          {canExit && (
            <GlassIconButton icon="close" size={40} iconSize={20} onPress={() => router.back()} />
          )}
        </View>

        {recording ? (
          <View style={styles.recPill}>
            <View style={styles.recDot} />
            <Text style={styles.recTime}>{formatDuration(elapsedSeconds)}</Text>
          </View>
        ) : (
          <View style={styles.modePill}>
            <Text style={styles.modeText}>TIMELAPSE</Text>
          </View>
        )}

        <View style={styles.topSide}>
          {!recording && !isCountingDown && (
            <GlassIconButton icon="camera-reverse" size={40} iconSize={20} onPress={toggleCameraFacing} />
          )}
        </View>
      </View>

      <SessionToast message={toast} top={previewLayout.top + 70} />

      {/* Framing tip before the first tap */}
      {!recording && !isCountingDown && previewLayout.height > 0 && (
        <View pointerEvents="none" style={[styles.tip, { top: previewLayout.top + previewLayout.height - 44 }]}>
          <Text style={styles.tipText}>Prop your phone up · frame your desk · drag the stamp</Text>
        </View>
      )}

      {/* Countdown overlay */}
      <CountdownOverlay isVisible={isCountingDown} onComplete={handleCountdownComplete} />

      {/* Bottom deck */}
      <View style={[styles.deck, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.deckSide}>
          <Text style={styles.deckLabel}>{recording ? 'EARNED' : 'TODAY'}</Text>
          <Text style={styles.deckValue}>
            {recording ? `+${earnedMin}` : formatHM(todayMinutes)}
            {recording && <Text style={styles.deckUnit}> min</Text>}
          </Text>
        </View>

        <ShutterButton
          isRecording={recording}
          disabled={isPreparing || isFinishing || isCountingDown}
          onStart={handleStartPress}
          onStop={handleStopHold}
          onHoldCancelled={() => setToast('Keep holding to stop')}
        />

        <View style={[styles.deckSide, styles.deckRight]}>
          <Text style={styles.deckLabel}>GOAL</Text>
          <Text style={styles.deckValue}>
            {goalLeft <= 0 ? 'Done' : formatHM(goalLeft)}
            {goalLeft > 0 && <Text style={styles.deckUnit}> left</Text>}
          </Text>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${Math.max(goalProgress * 100, 3)}%` }]} />
          </View>
        </View>
      </View>

      {isFinishing && (
        <View style={styles.finishing} pointerEvents="none">
          <ActivityIndicator color={T.white} />
          <Text style={styles.finishingText}>Developing your timelapse…</Text>
        </View>
      )}

      {/* Dev button */}
      {SESSION_DEV_MODE_ENABLED && !isSessionActive && (
        <Pressable
          onPress={simulateSession}
          style={[styles.devButton, { position: 'absolute', top: previewLayout.top + 70, right: 20, zIndex: 20 }]}
        >
          <Text style={styles.devButtonText}>Dev</Text>
        </Pressable>
      )}

      <ShortTimelapseWarningModal visible={showShortWarning} onClose={() => setShowShortWarning(false)} />

      <TimelapsePreviewSheet
        visible={showPreview}
        videoUri={previewUri}
        sessionDurationSeconds={previewDuration}
        onClose={handlePreviewClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E0E',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E0E',
  },
  previewContainer: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    borderRadius: 30,
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  recFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,102,0,0.85)',
  },
  topBar: {
    position: 'absolute',
    left: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topSide: {
    width: 40,
    height: 40,
  },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modeText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.orange,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recTime: {
    fontFamily: Fonts.monoBold,
    fontSize: 17,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  tip: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  tipText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 6,
  },
  deck: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 168,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    zIndex: 10,
  },
  deckSide: {
    width: 88,
  },
  deckRight: {
    alignItems: 'flex-end',
  },
  deckLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.45)',
  },
  deckValue: {
    marginTop: 2,
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  deckUnit: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
  },
  goalTrack: {
    marginTop: 6,
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  goalFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: T.orange,
  },
  finishing: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(14,14,14,0.6)',
    zIndex: 60,
  },
  finishingText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionHint: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
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
});
