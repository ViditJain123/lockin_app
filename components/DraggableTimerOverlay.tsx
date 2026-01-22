import { Fonts } from '@/constants/Fonts';
import { formatDuration } from '@/modules/TimelapseEngine';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Timer pill dimensions
const PILL_WIDTH = 100;
const PILL_HEIGHT = 40;
const PADDING = 20;

interface DraggableTimerOverlayProps {
  durationSeconds: number;
  isRecording: boolean;
  isDraggable: boolean;
  position: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export default function DraggableTimerOverlay({
  durationSeconds,
  isRecording,
  isDraggable,
  position,
  onPositionChange,
}: DraggableTimerOverlayProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Extract safe area values as constants for use in worklets
  const safeAreaTop = insets.top;
  const safeAreaBottom = insets.bottom;

  // Calculate initial position from normalized coordinates
  const getAbsoluteX = (normalizedX: number) =>
    normalizedX * screenWidth - PILL_WIDTH / 2;
  const getAbsoluteY = (normalizedY: number) =>
    normalizedY * screenHeight - PILL_HEIGHT / 2;

  // Shared values for position
  const translateX = useSharedValue(getAbsoluteX(position.x));
  const translateY = useSharedValue(getAbsoluteY(position.y));
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Update position when prop changes (e.g., on initial load)
  useEffect(() => {
    translateX.value = getAbsoluteX(position.x);
    translateY.value = getAbsoluteY(position.y);
  }, [position.x, position.y, screenWidth, screenHeight]);

  // Clamp values within screen bounds - workletized for UI thread
  const clampX = (x: number) => {
    'worklet';
    const minX = PADDING;
    const maxX = screenWidth - PILL_WIDTH - PADDING;
    return Math.max(minX, Math.min(maxX, x));
  };

  const clampY = (y: number) => {
    'worklet';
    const minY = safeAreaTop + PADDING;
    const maxY = screenHeight - PILL_HEIGHT - safeAreaBottom - PADDING;
    return Math.max(minY, Math.min(maxY, y));
  };

  // Haptic feedback function
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Save position callback
  const savePosition = (x: number, y: number) => {
    const normalizedX = (x + PILL_WIDTH / 2) / screenWidth;
    const normalizedY = (y + PILL_HEIGHT / 2) / screenHeight;
    onPositionChange?.({ x: normalizedX, y: normalizedY });
  };

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(isDraggable)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      translateX.value = clampX(startX.value + event.translationX);
      translateY.value = clampY(startY.value + event.translationY);
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      runOnJS(savePosition)(translateX.value, translateY.value);
    });

  // Animated style for the timer pill
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.pill}>
          {isRecording && <View style={styles.recordingDot} />}
          <Text style={styles.durationText}>
            {formatDuration(durationSeconds)}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 15,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    minWidth: PILL_WIDTH,
    height: PILL_HEIGHT,
    justifyContent: 'center',
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
