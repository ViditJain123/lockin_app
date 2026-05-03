import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassIconButton from '@/components/GlassIconButton';
import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import * as Haptics from '@/lib/haptics';
import { posthog } from '@/lib/posthog';

export default function PhotoCaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    lockedInSeconds?: string;
    sessionId?: string;
    activeTaskId?: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  // Synchronous guard against double-fire. setState batches across renders, so a
  // very fast double-tap (or a Pressable re-firing during the async window
  // before React commits the state update) can sneak past the `isCapturing`
  // check. A ref toggled BEFORE the await closes that window.
  const inFlightRef = useRef(false);
  // Set once we've successfully captured + navigated. Prevents any further
  // captures even if React schedules a stray onPress while the screen is
  // covered by the preview screen above. Reset on focus regain (retake).
  const hasCapturedRef = useRef(false);
  const cameraRef = useRef<CameraView>(null);

  const [previewLayout, setPreviewLayout] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
  });

  // Lock orientation to portrait so the captured photo aspect always matches
  // the 4:5 card target.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => {},
    );
    posthog.capture('photo_capture_mounted');
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  // When this screen regains focus (e.g. user tapped Retake on the preview and
  // is back here), clear the "already captured" latch so they can shoot again.
  useFocusEffect(
    useCallback(() => {
      hasCapturedRef.current = false;
      inFlightRef.current = false;
      setIsCapturing(false);
    }, []),
  );

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const reservedTop = insets.top + 60;
      const reservedBottom = insets.bottom + 130;
      const availableHeight = height - reservedTop - reservedBottom;
      setPreviewLayout({
        width,
        height: availableHeight,
        top: reservedTop,
        left: 0,
      });
    },
    [insets.top, insets.bottom],
  );

  const toggleCameraFacing = useCallback(() => {
    Haptics.optionSelect();
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const goSkip = useCallback(() => {
    posthog.capture('photo_skipped');
    router.replace({
      pathname: '/grind-complete',
      params: {
        grindDurationSeconds: params.lockedInSeconds ?? '0',
        lockedInSeconds: params.lockedInSeconds ?? '0',
        ...(params.activeTaskId ? { activeTaskId: params.activeTaskId } : {}),
      },
    } as any);
  }, [router, params.lockedInSeconds, params.activeTaskId]);

  const handleClose = useCallback(() => {
    Alert.alert(
      'Skip photo?',
      'Your grind has already been saved. You can skip the photo and continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: goSkip },
      ],
    );
  }, [goSkip]);

  const handleShutter = useCallback(async () => {
    // Synchronous guards. inFlightRef closes the window between tap and the
    // setState commit. hasCapturedRef prevents any tap after we've already
    // navigated away (the screen stays mounted under the preview).
    if (inFlightRef.current || hasCapturedRef.current) return;
    if (!cameraRef.current || !isCameraReady) return;
    inFlightRef.current = true;
    setIsCapturing(true);
    Haptics.buttonPress();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
        base64: false,
        shutterSound: true,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        throw new Error('No photo URI returned');
      }
      hasCapturedRef.current = true;
      posthog.capture('photo_taken');
      router.push({
        pathname: '/photo-preview',
        params: {
          photoUri: photo.uri,
          lockedInSeconds: params.lockedInSeconds ?? '0',
          sessionId: params.sessionId ?? '',
          ...(params.activeTaskId ? { activeTaskId: params.activeTaskId } : {}),
        },
      } as any);
    } catch (err: any) {
      console.warn('[PhotoCapture] Shutter failed:', err);
      posthog.capture('photo_capture_failed', {
        error: err?.message ?? String(err),
      });
      Alert.alert(
        'Capture failed',
        "Couldn't capture the photo. Try again or skip to continue.",
      );
    } finally {
      inFlightRef.current = false;
      setIsCapturing(false);
    }
  }, [isCameraReady, params.lockedInSeconds, params.sessionId, params.activeTaskId, router]);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionContent}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to take a quick photo of your grind.
          </Text>
          <GlassIconButton
            icon="camera"
            size={64}
            iconSize={28}
            onPress={requestPermission}
          />
          <Text style={styles.permissionHint}>Tap to enable camera</Text>
          <Pressable onPress={goSkip} style={styles.permissionSkip} hitSlop={12}>
            <Text style={styles.permissionSkipText}>SKIP PHOTO</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera preview */}
      <View
        style={[
          styles.previewContainer,
          {
            width: previewLayout.width,
            height: previewLayout.height,
            top: previewLayout.top,
            left: previewLayout.left,
          },
        ]}
      >
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          onCameraReady={handleCameraReady}
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

      {/* Top chrome — close + skip + eyebrow */}
      <View style={[styles.topRow, { top: insets.top + 12 }]}>
        <GlassIconButton icon="close" onPress={handleClose} />
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>CAPTURE THE WIN</Text>
        </View>
        <Pressable onPress={goSkip} style={styles.skipButton} hitSlop={12}>
          <Text style={styles.skipButtonText}>SKIP</Text>
        </Pressable>
      </View>

      {/* Bottom controls — flip + shutter */}
      <View style={[styles.bottomControls, { bottom: insets.bottom + 20 }]}>
        <View style={styles.bottomSideSlot} />
        <Pressable
          onPress={handleShutter}
          disabled={isCapturing || !isCameraReady}
          style={({ pressed }) => [
            styles.shutterOuter,
            pressed && !isCapturing && isCameraReady && styles.shutterOuterPressed,
            !isCameraReady && styles.shutterOuterDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
        >
          <View style={styles.shutterInner}>
            {isCapturing ? <ActivityIndicator size="small" color={LC.bg} /> : null}
          </View>
        </Pressable>
        <View style={styles.bottomSideSlot}>
          <GlassIconButton
            icon="camera-reverse"
            onPress={toggleCameraFacing}
            disabled={isCapturing}
          />
        </View>
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
  previewContainer: {
    position: 'absolute',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  topRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  eyebrowPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,59,92,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.3)',
  },
  eyebrowText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    color: LC.red,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  skipButton: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipButtonText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 2,
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
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  shutterOuterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
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
  permissionSkip: {
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  permissionSkipText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
  },
  // Viewfinder overlay
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
});
