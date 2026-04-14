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

export type TimerFilterType = 'minimal' | 'dateStamp';
export type DeviceOrientation = 'portrait' | 'landscape-left' | 'landscape-right';

interface DraggableTimerPlaceholderProps {
  containerWidth: number;
  containerHeight: number;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  enabled?: boolean;
  orientation?: DeviceOrientation;
  filterType?: TimerFilterType;
  onFilterToggle?: () => void;
  timerScale?: number;
  onScaleChange?: (scale: number) => void;
  isRecording?: boolean;
  elapsedSeconds?: number;
  containerTop?: number;
  containerLeft?: number;
}

// Timer placeholder dimensions
const TIMER_WIDTH = 100;
const TIMER_HEIGHT = 85;
const DATESTAMP_WIDTH = 100;
const DATESTAMP_HEIGHT = 110;
const HIT_AREA_PADDING = 50;

// Logo image for dateStamp filter
const logoImage = require('../assets/images/logo-no-bg-cropped.png');

const formatDate = (): string => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
      case 'landscape-left': return 90;
      case 'landscape-right': return -90;
      default: return 0;
    }
  }, [orientation]);

  const timerWidth = filterType === 'dateStamp' ? DATESTAMP_WIDTH : TIMER_WIDTH;
  const timerHeight = filterType === 'dateStamp' ? DATESTAMP_HEIGHT : TIMER_HEIGHT;

  const getPixelX = useCallback((percentX: number, width: number) => {
    const minX = 0;
    const maxX = Math.max(width - timerWidth, minX);
    const centerX = percentX * width;
    return Math.min(Math.max(centerX - timerWidth / 2, minX), maxX);
  }, [timerWidth]);

  const getPixelY = useCallback((percentY: number, height: number) => {
    const minY = 0;
    const maxY = Math.max(height - timerHeight, minY);
    const centerY = percentY * height;
    return Math.min(Math.max(centerY - timerHeight / 2, minY), maxY);
  }, [timerHeight]);

  const posX = useSharedValue(containerWidth > 0 ? getPixelX(position.x, containerWidth) : 100);
  const posY = useSharedValue(containerHeight > 0 ? getPixelY(position.y, containerHeight) : 100);
  const dragScale = useSharedValue(1);

  const currentPinchScale = useSharedValue(timerScale);
  const startPinchScale = useSharedValue(timerScale);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const minXShared = useSharedValue(0);
  const minYShared = useSharedValue(0);
  const maxXShared = useSharedValue(Math.max(containerWidth - timerWidth, 0));
  const maxYShared = useSharedValue(Math.max(containerHeight - timerHeight, 0));

  useEffect(() => {
    if (containerWidth > 0 && containerHeight > 0) {
      posX.value = getPixelX(position.x, containerWidth);
      posY.value = getPixelY(position.y, containerHeight);

      minXShared.value = 0;
      minYShared.value = 0;
      maxXShared.value = Math.max(containerWidth - timerWidth, 0);
      maxYShared.value = Math.max(containerHeight - timerHeight, 0);
    }
  }, [position.x, position.y, containerWidth, containerHeight, timerWidth, timerHeight]);

  useEffect(() => {
    currentPinchScale.value = timerScale;
    startPinchScale.value = timerScale;
  }, [timerScale]);

  const clamp = (value: number, min: number, max: number) => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  const updatePosition = useCallback(
    (x: number, y: number) => {
      const centerX = x + timerWidth / 2;
      const centerY = y + timerHeight / 2;
      const percentX = centerX / containerWidth;
      const percentY = centerY / containerHeight;

      const clampedX = Math.min(Math.max(percentX, 0), 1);
      const clampedY = Math.min(Math.max(percentY, 0), 1);

      onPositionChange({ x: clampedX, y: clampedY });
    },
    [containerWidth, containerHeight, onPositionChange, timerWidth, timerHeight]
  );

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleFilterToggle = useCallback(() => {
    if (onFilterToggle) {
      triggerHaptic();
      onFilterToggle();
    }
  }, [onFilterToggle, triggerHaptic]);

  const handleScaleChange = useCallback((newScale: number) => {
    if (onScaleChange) {
      onScaleChange(newScale);
    }
  }, [onScaleChange]);

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

  const tapGesture = Gesture.Tap()
    .enabled(enabled && !!onFilterToggle)
    .onStart(() => {
      'worklet';
      runOnJS(handleFilterToggle)();
    });

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

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture, pinchGesture);

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

  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  const displayTime = isRecording ? formatTime(elapsedSeconds) : '00:00:00';

  const renderMinimalFilter = () => (
    <View style={styles.timerBoxMinimal}>
      <Text style={styles.timerText}>{displayTime}</Text>
      <Text style={styles.brandText}>
        <Text style={styles.brandLockin}>LOCKIN </Text>
        <Text style={styles.brandClub}>CLUB</Text>
      </Text>
    </View>
  );

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
    fontFamily: 'Menlo-Bold',
    color: 'rgba(255, 255, 255, 0.95)',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  brandText: {
    marginTop: 2,
  },
  brandLockin: {
    fontSize: 11,
    fontFamily: 'Menlo-Bold',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  brandClub: {
    fontSize: 11,
    fontFamily: 'Menlo-Bold',
    color: '#FF3B5C',
    letterSpacing: 0.5,
  },
  dateStampContainer: {
    alignItems: 'flex-end',
  },
  dateStampTimer: {
    fontSize: 20,
    fontFamily: 'Menlo-Bold',
    color: 'rgba(255, 255, 255, 0.95)',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  dateStampDate: {
    fontSize: 11,
    fontFamily: 'Menlo-Bold',
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
