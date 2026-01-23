import CountdownOverlay from '@/components/CountdownOverlay';
import DraggableTimerOverlay from '@/components/DraggableTimerOverlay';
import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import RecordingTimer from '@/components/RecordingTimer';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useRecordingError, useRecordingStore } from '@/store/useRecordingStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '../../constants/Fonts';

// Button position constants
const BUTTON_DEFAULT_BOTTOM = 120; // Position above bottom navigation

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  // Recording state from Zustand store
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const isCountingDown = useRecordingStore((s) => s.isCountingDown);
  const durationSeconds = useRecordingStore((s) => s.durationSeconds);
  const timerPosition = useRecordingStore((s) => s.timerPosition);
  const startRecording = useRecordingStore((s) => s.startRecording);
  const stopRecording = useRecordingStore((s) => s.stopRecording);
  const setCountingDown = useRecordingStore((s) => s.setCountingDown);
  const setTimerPosition = useRecordingStore((s) => s.setTimerPosition);
  const recordingError = useRecordingError();

  // Keep screen awake and dim brightness during recording
  useScreenWakeLock(isRecording);


  // Show alert on recording error - but only for critical errors
  useEffect(() => {
    if (recordingError) {
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
            timerPositionX: String(timerPosition.x),
            timerPositionY: String(timerPosition.y),
          },
        } as any);
      }
    } else {
      // Start countdown instead of immediate recording
      setCountingDown(true);
    }
  }, [isRecording, isPreparing, isFinishing, isCountingDown, stopRecording, setCountingDown, durationSeconds, timerPosition]);

  // Callback when countdown completes - start the actual recording
  const handleCountdownComplete = useCallback(async () => {
    await startRecording({
      cameraPosition: facing,
      timerPositionX: timerPosition.x,
      timerPositionY: timerPosition.y,
    });
  }, [startRecording, facing, timerPosition]);

  // Hide countdown only when recording has actually started
  useEffect(() => {
    if (isRecording && isCountingDown) {
      setCountingDown(false);
    }
  }, [isRecording, isCountingDown, setCountingDown]);



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
    <View style={styles.container}>
      {/* Camera preview - always use expo-camera CameraView (even during recording) */}
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={flashEnabled}
      />

      {/* Countdown Overlay */}
      <CountdownOverlay
        isVisible={isCountingDown}
        onComplete={handleCountdownComplete}
      />

      {/* Top controls - Flash, Timer, and Flip buttons (hidden during countdown) */}
      {!isCountingDown && <View style={[styles.topControls, { marginTop: insets.top + 12 }]}>
        {/* Flash toggle - top left */}
        <GlassIconButton
          icon={flashEnabled ? 'flash' : 'flash-off'}
          onPress={toggleFlash}
          isActive={flashEnabled}
          activeColor="rgba(255, 220, 100, 0.95)"
        />

        {/* Fixed recording timer - center */}
        <RecordingTimer
          durationSeconds={durationSeconds}
          isRecording={isRecording || isFinishing}
        />

        {/* Camera flip - top right (disabled during recording) */}
        <GlassIconButton
          icon="camera-reverse"
          onPress={toggleCameraFacing}
          disabled={isRecording}
        />
      </View>}

      {/* Draggable timer overlay - visible before and during recording */}
      {!isCountingDown && (
        <DraggableTimerOverlay
          durationSeconds={isRecording || isFinishing ? durationSeconds : 0}
          isRecording={isRecording || isFinishing}
          isDraggable={!isRecording && !isPreparing && !isFinishing}
          position={timerPosition}
          onPositionChange={setTimerPosition}
        />
      )}

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
    alignItems: 'center',
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
});
