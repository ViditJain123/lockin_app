import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

import { Fonts } from '../constants/Fonts';
import { DeviceOrientation, TimerFilterType } from '@/store/useRecordingStore';

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

  /**
   * Timer filter type for different overlay styles
   */
  filterType?: TimerFilterType;

  /**
   * Callback when filter is toggled (tap gesture)
   */
  onFilterToggle?: () => void;

  /**
   * Current timer scale (1.0 - 2.5)
   */
  timerScale?: number;

  /**
   * Callback when scale changes (pinch gesture)
   */
  onScaleChange?: (scale: number) => void;

  /**
   * Whether recording is in progress (for showing live timer)
   */
  isRecording?: boolean;

  /**
   * Elapsed seconds during recording
   */
  elapsedSeconds?: number;

  /**
   * Container top offset (for positioning within preview bounds)
   */
  containerTop?: number;

  /**
   * Container left offset (for positioning within preview bounds)
   */
  containerLeft?: number;
}

// Timer placeholder dimensions (increased base size)
const TIMER_WIDTH = 100;
const TIMER_HEIGHT = 85;
const DATESTAMP_WIDTH = 100; // Narrower for dateStamp
const DATESTAMP_HEIGHT = 110; // Taller for timer + date + logo
const PADDING = 0; // No boundary restrictions - allow dragging to edges
const HIT_AREA_PADDING = 50; // Extra touch area around overlay for better pinch detection

// Logo image for dateStamp filter
const logoImage = require('../assets/images/logo-no-bg-cropped.png');

// Format current date as "d MMM, yyyy"
const formatDate = (): string => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format elapsed seconds as HH:MM:SS
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
  filterType = 'minimal',
  onFilterToggle,
  timerScale = 1.0,
  onScaleChange,
  isRecording = false,
  elapsedSeconds = 0,
  containerTop = 0,
  containerLeft = 0,
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

  // Get base dimensions based on filter type (scale is applied via transform)
  const timerWidth = filterType === 'dateStamp' ? DATESTAMP_WIDTH : TIMER_WIDTH;
  const timerHeight = filterType === 'dateStamp' ? DATESTAMP_HEIGHT : TIMER_HEIGHT;

  // Convert percentage position to pixel position (top-left corner based)
  // Uses unscaled dimensions for center offset (transform scales from layout box center)
  const getPixelX = useCallback((percentX: number, width: number) => {
    // Allow timer to reach absolute edges (visual content may extend off-screen when scaled)
    const minX = 0;
    const maxX = Math.max(width - timerWidth, minX);
    const centerX = percentX * width;
    // Center offset uses UNSCALED width (layout box center = visual center)
    return Math.min(Math.max(centerX - timerWidth / 2, minX), maxX);
  }, [timerWidth]);

  const getPixelY = useCallback((percentY: number, height: number) => {
    // Allow timer to reach absolute edges (visual content may extend off-screen when scaled)
    const minY = 0;
    const maxY = Math.max(height - timerHeight, minY);
    const centerY = percentY * height;
    return Math.min(Math.max(centerY - timerHeight / 2, minY), maxY);
  }, [timerHeight]);

  // Animated values for position - initialize to center as fallback
  const posX = useSharedValue(containerWidth > 0 ? getPixelX(position.x, containerWidth) : 100);
  const posY = useSharedValue(containerHeight > 0 ? getPixelY(position.y, containerHeight) : 100);
  const dragScale = useSharedValue(1);

  // Pinch scale values
  const currentPinchScale = useSharedValue(timerScale);
  const startPinchScale = useSharedValue(timerScale);

  // Store the starting position when gesture begins
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Shared values for bounds (needed in worklets) - allow reaching absolute edges
  const minXShared = useSharedValue(0);
  const minYShared = useSharedValue(0);
  const maxXShared = useSharedValue(Math.max(containerWidth - timerWidth, 0));
  const maxYShared = useSharedValue(Math.max(containerHeight - timerHeight, 0));

  // Update animated values when position prop or container dimensions change
  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      posX.value = getPixelX(position.x, containerWidth);
      posY.value = getPixelY(position.y, containerHeight);

      // Allow reaching absolute edges
      minXShared.value = 0;
      minYShared.value = 0;
      maxXShared.value = Math.max(containerWidth - timerWidth, 0);
      maxYShared.value = Math.max(containerHeight - timerHeight, 0);
    }
  }, [position.x, position.y, containerWidth, containerHeight, timerWidth, timerHeight]);

  // Sync pinch scale with prop
  useEffect(() => {
    currentPinchScale.value = timerScale;
    startPinchScale.value = timerScale;
  }, [timerScale]);

  // Clamp helper
  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  // Update position callback (runs on JS thread)
  const updatePosition = useCallback(
    (x: number, y: number) => {
      // Center of LAYOUT box (same as visual center due to transform origin)
      const centerX = x + timerWidth / 2;   // UNSCALED
      const centerY = y + timerHeight / 2;  // UNSCALED
      const percentX = centerX / containerWidth;
      const percentY = centerY / containerHeight;

      // Clamp to full range (allow dragging to edges)
      const clampedX = Math.min(Math.max(percentX, 0), 1);
      const clampedY = Math.min(Math.max(percentY, 0), 1);

      onPositionChange({ x: clampedX, y: clampedY });
    },
    [containerWidth, containerHeight, onPositionChange, timerWidth, timerHeight]
  );

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Filter toggle helper
  const handleFilterToggle = useCallback(() => {
    if (onFilterToggle) {
      triggerHaptic();
      onFilterToggle();
    }
  }, [onFilterToggle, triggerHaptic]);

  // Scale change helper
  const handleScaleChange = useCallback((newScale: number) => {
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  }, [onScaleChange]);

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      dragScale.value = withSpring(1.05, { damping: 15, stiffness: 200 });
      startX.value = posX.value;
      startY.value = posY.value;
    })
    .onUpdate((event) => {
      'worklet';
      posX.value = clamp(startX.value + event.translationX, minXShared.value, maxXShared.value);
      posY.value = clamp(startY.value + event.translationY, minYShared.value, maxYShared.value);
    })
    .onEnd(() => {
      'worklet';
      dragScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      runOnJS(updatePosition)(posX.value, posY.value);
    });

  // Tap gesture for filter toggle
  const tapGesture = Gesture.Tap()
    .enabled(enabled && !!onFilterToggle)
    .onStart(() => {
      'worklet';
      runOnJS(handleFilterToggle)();
    });

  // Pinch gesture for scaling (min = 1.0, max = 2.5)
  const pinchGesture = Gesture.Pinch()
    .enabled(enabled && !!onScaleChange)
    .onStart(() => {
      'worklet';
      startPinchScale.value = currentPinchScale.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newScale = startPinchScale.value * event.scale;
      currentPinchScale.value = clamp(newScale, 1.0, 2.5);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(handleScaleChange)(currentPinchScale.value);
    });

  // Combine all gestures
  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture, pinchGesture);

  // Animated style using left/top positioning
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: posX.value,
      top: posY.value,
      transform: [
        { scale: currentPinchScale.value * dragScale.value },
        { rotate: `${rotationDegrees}deg` },
      ],
    };
  }, [rotationDegrees]);

  // Don't render if container dimensions are not yet known
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  // Calculate display time - live during recording, 00:00:00 otherwise
  const displayTime = isRecording ? formatTime(elapsedSeconds) : '00:00:00';

  // Render minimal filter (timer + LOCKIN CLUB, with background, no border)
  const renderMinimalFilter = () => (
    <View style={styles.timerBoxMinimal}>
      <Text style={styles.timerText}>{displayTime}</Text>
      <Text style={styles.brandText}>
        <Text style={styles.brandLockin}>LOCKIN </Text>
        <Text style={styles.brandClub}>CLUB</Text>
      </Text>
    </View>
  );

  // Render dateStamp filter (timer + date + logo, right-aligned, no background)
  const renderDateStampFilter = () => (
    <View style={styles.dateStampContainer}>
      <Text style={styles.dateStampTimer}>{displayTime}</Text>
      <Text style={styles.dateStampDate}>{formatDate()}</Text>
      <Image
        source={logoImage}
        style={styles.dateStampLogo}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View
      style={{
        position: 'absolute',
        left: containerLeft,
        top: containerTop,
        width: containerWidth,
        height: containerHeight,
        zIndex: 100,
      }}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[
          styles.container,
          animatedStyle,
          {
            padding: HIT_AREA_PADDING,
            margin: -HIT_AREA_PADDING,
          }
        ]}>
          <View>
            {filterType === 'minimal' ? renderMinimalFilter() : renderDateStampFilter()}
            {!isRecording && <Text style={styles.hint}>Tap to change style</Text>}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 100,
  },
  // Minimal filter styles (with background, no border)
  timerBoxMinimal: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    minWidth: 100,
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
  // DateStamp filter styles (right-aligned, no background)
  dateStampContainer: {
    alignItems: 'flex-end',
  },
  dateStampTimer: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.95)',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  dateStampDate: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'right',
  },
  dateStampLogo: {
    width: 40,
    height: 20,
    marginTop: 6,
  },
  hint: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});

export default DraggableTimerPlaceholder;
