import CountdownOverlay from '@/components/CountdownOverlay';
import { DraggableTimerPlaceholder } from '@/components/DraggableTimerPlaceholder';
import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import ShortTimelapseWarningModal from '@/components/ShortTimelapseWarningModal';
import TimelapsePreviewSheet from '@/components/TimelapsePreviewSheet';
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
import { useVideoGalleryStore } from '@/store/useVideoGalleryStore';
import { Ionicons } from '@expo/vector-icons';
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
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAPTURE_INTERVAL_MS = 12000; // 12 seconds between frames
const BUTTON_DEFAULT_BOTTOM = 120;

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
  const [flashEnabled, setFlashEnabled] = useState(false);
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
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Pause/resume capture when app backgrounds
  useEffect(() => {
    if (!isSessionActive) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (!captureIntervalRef.current && isSessionActiveRef.current) {
          captureIntervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
        }
      } else {
        if (captureIntervalRef.current) {
          clearInterval(captureIntervalRef.current);
          captureIntervalRef.current = null;
        }
      }
    });
    return () => subscription.remove();
  }, [isSessionActive, captureFrame]);

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
      await Timelapse.startRecording(
        videoWidth, videoHeight, deviceOrientation,
        timerPosition.x, timerPosition.y, timerFilter, timerScale
      );
      setTimeout(() => captureFrame(), 500);
      captureIntervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS);
    } catch (e) {
      console.warn('Failed to start timelapse recording:', e);
    }
  }, [captureFrame, setIsSessionActive, deviceOrientation, timerPosition, timerFilter, timerScale]);

  // Stop session
  const stopSession = useCallback(async (skipPreview: boolean = false) => {
    const sessionEndTime = new Date();
    const sessionStartTime = sessionStartTimeRef.current || sessionEndTime;
    const lockedInSeconds = elapsedSecondsRef.current;

    isSessionActiveRef.current = false;
    setIsSessionActive(false);
    setIsFinishing(true);

    Haptics.sessionStop();

    // Stop capture interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
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

    // Process timelapse video
    try {
      const videoPath = await Timelapse.stopRecording();
      if (videoPath) {
        const docsDir = FileSystem.documentDirectory + 'timelapses/';
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        const filename = videoPath.split('/').pop()!;
        const permanentUri = docsDir + filename;
        await FileSystem.moveAsync({ from: videoPath, to: permanentUri });

        // Generate thumbnail
        let thumbnailRelPath: string | null = null;
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(permanentUri, { time: 0 });
          const thumbsDir = FileSystem.documentDirectory + 'thumbnails/';
          await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
          const thumbFilename = sessionId + '.jpg';
          await FileSystem.copyAsync({ from: thumb.uri, to: thumbsDir + thumbFilename });
          thumbnailRelPath = 'thumbnails/' + thumbFilename;
        } catch {
          // Thumbnail generation failed, continue without it
        }

        // Persist recording metadata
        useVideoGalleryStore.getState().addRecording({
          id: sessionId,
          videoUri: 'timelapses/' + filename,
          thumbnailUri: thumbnailRelPath,
          sessionDurationSeconds: lockedInSeconds,
          createdAt: new Date().toISOString(),
        });

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
      } else {
        setIsFinishing(false);
      }
    } catch (e: any) {
      setIsFinishing(false);
      if (e?.code !== 'ERR_EMPTY') {
        console.warn('Failed to stop timelapse recording:', e);
      }
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
    const newFacing = facing === 'back' ? 'front' : 'back';
    if (newFacing === 'front' && flashEnabled) {
      setFlashEnabled(false);
    }
    setFacing(newFacing);
  }, [isSessionActive, facing, flashEnabled]);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    if (facing === 'front') return;
    setFlashEnabled(!flashEnabled);
  }, [facing, flashEnabled]);

  // Toggle filter type
  const handleFilterToggle = useCallback(() => {
    setTimerFilter(timerFilter === 'minimal' ? 'dateStamp' : 'minimal');
  }, [timerFilter, setTimerFilter]);

  // Handle container layout
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerLayout({ width, height });

    const targetAspect = 9 / 16;
    const previewWidth = width;
    const previewHeight = width / targetAspect;
    const tabBarOffset = 49 + insets.bottom;
    const previewBottomFromScreenBottom = (BUTTON_DEFAULT_BOTTOM + tabBarOffset) / 2;
    const top = height - previewHeight - previewBottomFromScreenBottom;

    setPreviewLayout({
      width: previewWidth,
      height: previewHeight,
      top: Math.max(0, top),
      left: 0,
    });
  }, [insets.bottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (isSessionActiveRef.current) {
        Timelapse.cancelRecording().catch(() => {});
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
          enableTorch={flashEnabled && facing === 'back'}
        />
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

      {/* Top controls - Flash and Flip */}
      {!isCountingDown && (
        <View style={[styles.topControls, { marginTop: insets.top + 12 }]}>
          <GlassIconButton
            icon={flashEnabled ? 'flash' : 'flash-off'}
            onPress={toggleFlash}
            isActive={flashEnabled}
            activeColor="rgba(255, 220, 100, 0.95)"
            disabled={facing === 'front'}
          />
          <GlassIconButton
            icon="camera-reverse"
            onPress={toggleCameraFacing}
            disabled={isSessionActive}
          />
        </View>
      )}

      {/* Recording duration pill */}
      {(isSessionActive || isFinishing) && (
        <View style={[styles.durationContainer, { top: insets.top + 12 }]}>
          <View style={styles.durationPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>
          {activeTask && (
            <View style={styles.activeTaskPill}>
              <Ionicons name="checkbox-outline" size={13} color="#FF3B5C" />
              <Text style={styles.activeTaskText} numberOfLines={1}>
                {activeTask.title}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom control - Record button */}
      <View style={styles.bottomControls}>
        <GlassRecordButton
          onPress={handleRecordPress}
          isRecording={isSessionActive || isFinishing}
          disabled={isPreparing || isFinishing || isCountingDown}
        />
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
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BUTTON_DEFAULT_BOTTOM,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  durationText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    fontVariant: ['tabular-nums'],
  },
  activeTaskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
    gap: 6,
    maxWidth: 220,
  },
  activeTaskText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: Fonts.medium,
    flexShrink: 1,
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
