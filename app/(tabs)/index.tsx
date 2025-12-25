import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import { formatDuration, isTimelapseAvailable } from '@/modules/TimelapseEngine';
import { useRecordingError, useRecordingStore } from '@/store/useRecordingStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation timing for iOS-native feel
const BUTTON_TIMING = {
  duration: 280,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1), // iOS standard easing
};

// Button position constants
const BUTTON_DEFAULT_BOTTOM = 120; // Position above bottom navigation
const BUTTON_RECORDING_BOTTOM = 40; // Position when recording (above safe area)

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  // Recording state from Zustand store
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isPreparing = useRecordingStore((s) => s.isPreparing);
  const isFinishing = useRecordingStore((s) => s.isFinishing);
  const durationSeconds = useRecordingStore((s) => s.durationSeconds);
  const frameCount = useRecordingStore((s) => s.frameCount);
  const startRecording = useRecordingStore((s) => s.startRecording);
  const stopRecording = useRecordingStore((s) => s.stopRecording);
  const recordingError = useRecordingError();

  // Shared value for button position animation
  const buttonProgress = useSharedValue(0);

  // Update button position when recording state changes
  useEffect(() => {
    buttonProgress.value = withTiming(isRecording ? 1 : 0, BUTTON_TIMING);
  }, [isRecording]);

  // Show alert on recording error
  useEffect(() => {
    if (recordingError) {
      Alert.alert(
        'Recording Error',
        recordingError.message,
        [{ text: 'OK', onPress: () => useRecordingStore.getState().resetError() }]
      );
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
    if (isPreparing || isFinishing) return; // Ignore during transitions

    if (isRecording) {
      // Stop recording
      const result = await stopRecording();
      if (result) {
        // Show success message
        Alert.alert(
          'Timelapse Saved! 🎬',
          `Captured ${result.frameCount} frames\nDuration: ${formatDuration(result.durationSeconds)}`,
          [{ text: 'OK' }]
        );
      }
    } else {
      // Start recording
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

      await startRecording({
        captureIntervalMs: 500, // 2fps capture
        outputFps: 60,         // 60fps output
        codec: 'h264',
        saveToGallery: true,
      });
    }
  }, [isRecording, isPreparing, isFinishing, startRecording, stopRecording]);

  // Animated style for record button position
  const animatedButtonStyle = useAnimatedStyle(() => {
    // Calculate the drop distance based on navbar slide
    const dropDistance = BUTTON_DEFAULT_BOTTOM - BUTTON_RECORDING_BOTTOM - insets.bottom;

    return {
      transform: [{ translateY: buttonProgress.value * dropDistance }],
    };
  });

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
      {/* Full-screen camera preview */}
      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={flashEnabled}
      />

      {/* Top controls - Flash and Flip buttons */}
      <View style={[styles.topControls, { marginTop: insets.top + 12 }]}>
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
      </View>

      {/* Recording duration display */}
      {isRecording && (
        <View style={[styles.durationContainer, { top: insets.top + 70 }]}>
          <View style={styles.durationPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.durationText}>
              {formatDuration(durationSeconds)}
            </Text>
          </View>
          <Text style={styles.frameCountText}>
            {frameCount} frames
          </Text>
        </View>
      )}

      {/* Preparing/Finishing overlay */}
      {(isPreparing || isFinishing) && (
        <View style={styles.preparingOverlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.preparingText}>
            {isPreparing ? 'Starting...' : 'Saving...'}
          </Text>
        </View>
      )}

      {/* Bottom control zone - Record button */}
      {/* Animated position - drops down when recording */}
      <Animated.View style={[styles.bottomControls, animatedButtonStyle]}>
        <GlassRecordButton
          onPress={handleRecordPress}
          isRecording={isRecording}
          disabled={isPreparing || isFinishing}
        />
      </Animated.View>
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
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionHint: {
    fontSize: 14,
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
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  frameCountText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  preparingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  preparingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
});
