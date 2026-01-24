import React, { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { Fonts } from '../constants/Fonts';
import { DeviceOrientation } from '@/store/useRecordingStore';

interface DraggableTimerPlaceholderProps {
  /**
   * Container dimensions for calculating percentage position
   */
  containerWidth: number;
  containerHeight: number;

  /**
   * Current position as percentage (0-1)
   */
  position: { x: number; y: number };

  /**
   * Callback when position changes
   */
  onPositionChange: (position: { x: number; y: number }) => void;

  /**
   * Whether dragging is enabled
   */
  enabled?: boolean;

  /**
   * Device orientation for rotating the timer display
   */
  orientation?: DeviceOrientation;
}

// Timer placeholder dimensions (approximate)
const TIMER_WIDTH = 120;
const TIMER_HEIGHT = 70;
const PADDING = 20;

/**
 * Draggable timer placeholder component for positioning the timer overlay
 * in the final time-lapse video.
 */
export function DraggableTimerPlaceholder({
  containerWidth,
  containerHeight,
  position,
  onPositionChange,
  enabled = true,
  orientation = 'portrait',
}: DraggableTimerPlaceholderProps) {
  // Calculate rotation based on orientation
  const rotationDegrees = useMemo(() => {
    switch (orientation) {
      case 'landscape-left':
        // Device rotated clockwise, so rotate content 90deg clockwise
        return 90;
      case 'landscape-right':
        // Device rotated counter-clockwise, so rotate content 90deg counter-clockwise
        return -90;
      default:
        return 0;
    }
  }, [orientation]);
  // Convert percentage position to pixel position (top-left corner based)
  const getPixelX = useCallback((percentX: number, width: number) => {
    const maxXVal = Math.max(width - TIMER_WIDTH - PADDING, PADDING);
    const centerX = percentX * width;
    return Math.min(Math.max(centerX - TIMER_WIDTH / 2, PADDING), maxXVal);
  }, []);

  const getPixelY = useCallback((percentY: number, height: number) => {
    const maxYVal = Math.max(height - TIMER_HEIGHT - PADDING, PADDING);
    const centerY = percentY * height;
    return Math.min(Math.max(centerY - TIMER_HEIGHT / 2, PADDING), maxYVal);
  }, []);

  // Animated values for position - initialize to center as fallback
  const posX = useSharedValue(containerWidth > 0 ? getPixelX(position.x, containerWidth) : 100);
  const posY = useSharedValue(containerHeight > 0 ? getPixelY(position.y, containerHeight) : 100);
  const scale = useSharedValue(1);

  // Store the starting position when gesture begins
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Shared values for bounds (needed in worklets)
  const maxXShared = useSharedValue(Math.max(containerWidth - TIMER_WIDTH - PADDING, PADDING));
  const maxYShared = useSharedValue(Math.max(containerHeight - TIMER_HEIGHT - PADDING, PADDING));

  // Update animated values when position prop or container dimensions change
  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      posX.value = getPixelX(position.x, containerWidth);
      posY.value = getPixelY(position.y, containerHeight);
      maxXShared.value = Math.max(containerWidth - TIMER_WIDTH - PADDING, PADDING);
      maxYShared.value = Math.max(containerHeight - TIMER_HEIGHT - PADDING, PADDING);
    }
  }, [position.x, position.y, containerWidth, containerHeight, getPixelX, getPixelY]);

  // Clamp helper
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  // Update position callback (runs on JS thread)
  const updatePosition = useCallback(
    (x: number, y: number) => {
      // Convert pixel position (top-left) to percentage (center-based)
      const centerX = x + TIMER_WIDTH / 2;
      const centerY = y + TIMER_HEIGHT / 2;
      const percentX = centerX / containerWidth;
      const percentY = centerY / containerHeight;

      // Clamp to valid range
      const clampedX = Math.min(Math.max(percentX, 0.05), 0.95);
      const clampedY = Math.min(Math.max(percentY, 0.05), 0.95);

      onPositionChange({ x: clampedX, y: clampedY });
    },
    [containerWidth, containerHeight, onPositionChange]
  );

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.05, { damping: 15, stiffness: 200 });
      startX.value = posX.value;
      startY.value = posY.value;
    })
    .onUpdate((event) => {
      'worklet';
      posX.value = clamp(startX.value + event.translationX, PADDING, maxXShared.value);
      posY.value = clamp(startY.value + event.translationY, PADDING, maxYShared.value);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      runOnJS(updatePosition)(posX.value, posY.value);
    });

  // Animated style using left/top positioning
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: posX.value,
      top: posY.value,
      transform: [
        { scale: scale.value },
        { rotate: `${rotationDegrees}deg` },
      ],
    };
  }, [rotationDegrees]);

  // Don't render if container dimensions are not yet known
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>00:00:00</Text>
          <Text style={styles.brandText}>
            <Text style={styles.brandLockin}>LOCKIN </Text>
            <Text style={styles.brandClub}>CLUB</Text>
          </Text>
        </View>
        <Text style={styles.hint}>Drag to position</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 100,
  },
  timerBox: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.95)',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  brandText: {
    marginTop: 2,
  },
  brandLockin: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  brandClub: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#FF3B5C',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});

export default DraggableTimerPlaceholder;
