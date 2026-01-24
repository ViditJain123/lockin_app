import CountdownOverlay from '@/components/CountdownOverlay';
import { DraggableTimerPlaceholder } from '@/components/DraggableTimerPlaceholder';
import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import { TimelapsePreview } from '@/components/TimelapsePreview';
import { useOrientationDetection } from '@/hooks/useOrientationDetection';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { formatDuration, isCallInProgress, isTimelapseAvailable } from '@/modules/TimelapseEngine';
import { useRecordingError, useRecordingStore, useTimerPosition } from '@/store/useRecordingStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { Fonts } from '../../constants/Fonts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Button position constants
const BUTTON_DEFAULT_BOTTOM = 120; // Position above bottom navigation

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });
  const insets = useSafeAreaInsets();

  // Timer position state
  const timerPosition = useTimerPosition();
  const setTimerPosition = useRecordingStore((s) => s.setTimerPosition);

  // Recording state from Zustand store
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);
  const durationSeconds = useRecordingStore((s) => s.durationSeconds);
  const startRecording = useRecordingStore((s) => s.startRecording);
  const stopRecording = useRecordingStore((s) => s.stopRecording);
  const setCountingDown = useRecordingStore((s) => s.setCountingDown);
  const recordingError = useRecordingError();

  // Keep screen awake and dim brightness during recording
  useScreenWakeLock(isRecording);

  // Detect device orientation (locks when recording starts)
  const deviceOrientation = useOrientationDetection();


  // Show alert on recording error - but only for critical errors
  // Filter out transient errors like frame encoding failures that don't stop recording
  useEffect(() => {
    if (recordingError) {
      // Filter out non-critical errors that don't stop recording
      const isCriticalError = 
        recordingError.code === 'START_FAILED' ||
        recordingError.code === 'STOP_FAILED' ||
        recordingError.code === 'PLATFORM_NOT_SUPPORTED' ||
        recordingError.message.includes('stopped') ||
        recordingError.message.includes('denied');
      
      if (isCriticalError) {
        Alert.alert(
          'Recording Error',
          recordingError.message,
          [{ text: 'OK', onPress: () => useRecordingStore.getState().resetError() }]
        );
      } else {
        // Just log non-critical errors and reset
        console.log('[Timelapse] Non-critical error:', recordingError.message);
        useRecordingStore.getState().resetError();
      }
    }
  }, [recordingError]);

  // Toggle camera facing direction
  const toggleCameraFacing = useCallback(() => {
    if (isRecording) return; // Don't switch during recording
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, [isRecording]);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    setFlashEnabled((current) => !current);
  }, []);

  // Handle record button press
  const handleRecordPress = useCallback(async () => {
    if (isPreparing || isFinishing || isCountingDown) return; // Ignore during transitions

    if (isRecording) {
      // Capture grind duration before stopping (real-world recording time)
      const grindDuration = durationSeconds;

      // Stop recording and navigate to preview
      const result = await stopRecording();
      if (result?.uri) {
        router.push({
          pathname: '/preview' as const,
          params: {
            videoUri: result.uri,
            grindDurationSeconds: String(grindDuration),
          },
        } as any);
      }
    } else {
      // Check if timelapse is available
      if (!isTimelapseAvailable()) {
        Alert.alert(
          'Not Available',
          Platform.OS === 'ios'
            ? 'Timelapse requires a native build. Please run: npx expo run:ios'
            : 'Timelapse is currently only available on iOS.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if user is on a phone call
      const callActive = await isCallInProgress();
      if (callActive) {
        Alert.alert(
          'Phone Call Active',
          'Please end your phone call before starting a timelapse recording.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start countdown instead of immediate recording
      setCountingDown(true);
    }
  }, [isRecording, isPreparing, isFinishing, isCountingDown, stopRecording, setCountingDown, durationSeconds]);

  // Callback when countdown completes - start the actual recording
  // Note: Don't hide countdown here - let it stay visible until recording actually starts
  const handleCountdownComplete = useCallback(async () => {
    await startRecording({
      captureIntervalMs: 500, // 2fps capture
      outputFps: 60,         // 60fps output
      codec: 'h264',
      saveToGallery: false,  // Don't auto-save, user will save from preview
      cameraPosition: facing, // Use current camera facing direction
      timerPosition: timerPosition, // Use user-positioned timer location
      orientation: deviceOrientation, // Pass current orientation for timer rotation
    });
  }, [startRecording, facing, timerPosition, deviceOrientation]);

  // Hide countdown only when recording has actually started (prevents black screen flash)
  useEffect(() => {
    if (isRecording && isCountingDown) {
      setCountingDown(false);
    }
  }, [isRecording, isCountingDown, setCountingDown]);

  // Handle container layout to get dimensions for draggable timer
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerLayout({ width, height });
  }, []);



  // Loading state while checking permissions
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient
          colors={['#000000', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Permission not granted - show request UI
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient
          colors={['#000000', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
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
      {/* Camera preview - switch between expo-camera and native preview during recording */}
      {/* When preparing, recording, or finishing, use native TimelapsePreview which shares the capture session */}
      {/* When not recording, use expo-camera for standard preview */}
      {(isPreparing || isRecording || isFinishing) ? (
        <TimelapsePreview style={styles.camera} />
      ) : (
        <CameraView
          style={styles.camera}
          facing={facing}
          enableTorch={flashEnabled}
        />
      )}

      {/* Draggable timer placeholder - visible when NOT recording */}
      {!isRecording && !isPreparing && !isFinishing && !isCountingDown && (
        <DraggableTimerPlaceholder
          containerWidth={containerLayout.width}
          containerHeight={containerLayout.height}
          position={timerPosition}
          onPositionChange={setTimerPosition}
          enabled={true}
          orientation={deviceOrientation}
        />
      )}

      {/* Countdown Overlay */}
      <CountdownOverlay
        isVisible={isCountingDown}
        onComplete={handleCountdownComplete}
      />

      {/* Top controls - Flash and Flip buttons (hidden during countdown) */}
      {!isCountingDown && <View style={[styles.topControls, { marginTop: insets.top + 12 }]}>
        {/* Flash toggle - top left */}
        <GlassIconButton
          icon={flashEnabled ? 'flash' : 'flash-off'}
          onPress={toggleFlash}
          isActive={flashEnabled}
          activeColor="rgba(255, 220, 100, 0.95)"
        />

        {/* Camera flip - top right (disabled during recording) */}
        <GlassIconButton
          icon="camera-reverse"
          onPress={toggleCameraFacing}
          disabled={isRecording}
        />
      </View>}

      {/* Recording duration display - stays visible during finishing */}
      {(isRecording || isFinishing) && (
        <View style={[styles.durationContainer, { top: insets.top + 12 }]}>
          <View style={styles.durationPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>
              {formatDuration(durationSeconds)}
            </Text>
          </View>
        </View>
      )}

      {/* No loader overlay - recording start/stop happens seamlessly in background */}

      {/* Bottom control zone - Record button */}
      <View style={styles.bottomControls}>
        <GlassRecordButton
          onPress={handleRecordPress}
          isRecording={isRecording || isFinishing}
          disabled={isPreparing || isFinishing || isCountingDown}
        />
      </View>
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
  camera: {
    ...StyleSheet.absoluteFillObject,
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
    height: 80, // Fixed height to prevent button position shift
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
});
