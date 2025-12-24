import GlassIconButton from '@/components/GlassIconButton';
import GlassRecordButton from '@/components/GlassRecordButton';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const insets = useSafeAreaInsets();

  // Toggle camera facing direction
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashEnabled((current) => !current);
  };

  // Handle record button press (UI only for now)
  const handleRecordPress = () => {
    // TODO: Implement recording logic
    console.log('Record button pressed');
  };

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

        {/* Camera flip - top right */}
        <GlassIconButton
          icon="camera-reverse"
          onPress={toggleCameraFacing}
        />
      </View>

      {/* Bottom control zone - Record button */}
      {/* Positioned above the bottom navigation bar */}
      <View style={styles.bottomControls}>
        <GlassRecordButton onPress={handleRecordPress} />
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
    bottom: 120, // Position above the bottom navigation bar
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
});
