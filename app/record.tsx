import CountdownOverlay from '@/components/CountdownOverlay';
import { DraggableTimerPlaceholder } from '@/components/DraggableTimerPlaceholder';
import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import ShortTimelapseWarningModal from '@/components/ShortTimelapseWarningModal';
import TimelapsePreviewSheet from '@/components/TimelapsePreviewSheet';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { useAuth } from '@/contexts/AuthContext';
import { SESSION_DEV_MODE_ENABLED } from '@/lib/config';
import { getLocalDateString } from '@/lib/dateUtils';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';
import * as Timelapse from '@/lib/timelapseModule';
import { sendSessionEvent } from '@/lib/tinybird';
import { useAppLockStore } from '@/store/useAppLockStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';
import { useOrientationDetection } from '@/hooks/useOrientationDetection';
import { useRecordingStore } from '@/store/useRecordingStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTaskStore } from '@/store/useTaskStore';
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
  const activeTaskId = useRecordingStore((s) => s.activeTaskId);
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

  // Active task from Tasks tab
  const activeTask = useTaskStore((s) =>
    s.tasks.find((t) => t.id === activeTaskId)
  );

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

    Haptics.sessionStart();
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

    Haptics.sessionStop();

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
      videoPath = await Timelapse.stopRecording(lockedInSeconds);
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
      ...(activeTaskId ? { activeTaskId } : {}),
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
  }, [user, setIsSessionActive, setIsFinishing, router, activeTaskId]);

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

  // Handle record button press
  const handleRecordPress = useCallback(async () => {
    if (isPreparing || isFinishing || isCountingDown) return;

    if (isSessionActive) {
      // Check short session
      if (elapsedSecondsRef.current < 60) {
        // Stop recording first so video is saved, then show warning.
        // Skip the preview sheet — the warning already communicates the issue.
        await stopSession(true);
        setShowShortWarning(true);
        return;
      }
      await stopSession(false);
    } else {
      // Start countdown
      setIsCountingDown(true);
    }
  }, [isSessionActive, isPreparing, isFinishing, isCountingDown, stopSession, setIsCountingDown]);

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
    const reservedTop = insets.top + 60;
    const reservedBottom = insets.bottom + 130;
    const availableHeight = height - reservedTop - reservedBottom;

    setPreviewLayout({
      width,
      height: availableHeight,
      top: reservedTop,
      left: 0,
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
        <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
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

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Dev button */}
      {SESSION_DEV_MODE_ENABLED && !isSessionActive && (
        <Pressable
          onPress={simulateSession}
          style={[styles.devButton, { position: 'absolute', top: insets.top + 8, right: 24, zIndex: 20 }]}
        >
          <Text style={styles.devButtonText}>Dev</Text>
        </Pressable>
      )}

      {/* Camera preview */}
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

        {/* Rule-of-thirds grid */}
        {[0.333, 0.667].map((p) => (
          <View
            key={`h${p}`}
            pointerEvents="none"
            style={[styles.gridLineH, { top: `${p * 100}%` }]}
          />
        ))}
        {[0.333, 0.667].map((p) => (
          <View
            key={`v${p}`}
            pointerEvents="none"
            style={[styles.gridLineV, { left: `${p * 100}%` }]}
          />
        ))}

        {/* Corner brackets */}
        <View pointerEvents="none" style={[styles.cornerBracket, styles.cornerTL]} />
        <View pointerEvents="none" style={[styles.cornerBracket, styles.cornerTR]} />
        <View pointerEvents="none" style={[styles.cornerBracket, styles.cornerBL]} />
        <View pointerEvents="none" style={[styles.cornerBracket, styles.cornerBR]} />
      </View>

      {/* Draggable timer placeholder */}
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

      {/* Countdown overlay */}
      <CountdownOverlay
        isVisible={isCountingDown}
        onComplete={handleCountdownComplete}
      />

      {/* Recording duration pill */}
      {(isSessionActive || isFinishing) && (
        <View style={[styles.durationContainer, { top: insets.top + 12 }]}>
          <View style={styles.durationPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>
              REC · {formatDuration(elapsedSeconds)}
            </Text>
          </View>
          {activeTask && (
            <View style={styles.activeTaskPill}>
              <View style={styles.taskDot} />
              <Text style={styles.activeTaskText} numberOfLines={1}>
                {activeTask.title}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* SCREEN TIME EARNED ticker (LC timelapse chrome) — sits just above the bottom controls */}
      {isSessionActive && (
        <View
          pointerEvents="none"
          style={[styles.earnedTicker, { bottom: insets.bottom + 140 }]}
        >
          <Text style={styles.earnedLabel}>SCREEN TIME EARNED</Text>
          <Text style={styles.earnedValue}>
            +{Math.floor(elapsedSeconds / 60)}
            <Text style={styles.earnedUnit}> MIN</Text>
          </Text>
        </View>
      )}

      {/* Bottom controls — exit + record + flip, sitting below the preview */}
      <View style={[styles.bottomControls, { bottom: insets.bottom + 20 }]}>
        <View style={styles.bottomSideSlot}>
          {canExit ? (
            <GlassIconButton
              icon="close"
              onPress={() => router.back()}
            />
          ) : null}
        </View>
        <GlassRecordButton
          onPress={handleRecordPress}
          isRecording={isSessionActive || isFinishing}
          disabled={isPreparing || isFinishing || isCountingDown}
        />
        <View style={styles.bottomSideSlot}>
          {!isCountingDown ? (
            <GlassIconButton
              icon="camera-reverse"
              onPress={toggleCameraFacing}
              disabled={isSessionActive}
            />
          ) : null}
        </View>
      </View>

      {/* Short Timelapse Warning Modal */}
      <ShortTimelapseWarningModal
        visible={showShortWarning}
        onClose={() => setShowShortWarning(false)}
      />

      {/* Timelapse preview sheet — same component used on the profile grid */}
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
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  previewContainer: {
    position: 'absolute',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  bottomSideSlot: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
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
  durationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    gap: 8,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LC.red,
    shadowColor: LC.red,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: Fonts.monoBold,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    textTransform: 'uppercase',
  },
  activeTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
    maxWidth: 260,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LC.red,
  },
  activeTaskText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: Fonts.interMedium,
    flexShrink: 1,
  },
  // Viewfinder overlay (rule-of-thirds + corner brackets)
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 5,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 5,
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    zIndex: 6,
  },
  cornerTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  // SCREEN TIME EARNED ticker
  earnedTicker: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  earnedLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  earnedValue: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: '#fff',
    letterSpacing: 0.5,
    marginTop: 4,
    includeFontPadding: false,
  },
  earnedUnit: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
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
