import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// Button sizing - iOS Camera style
const OUTER_SIZE = 80;
const OUTER_STROKE_WIDTH = 5;
const INNER_IDLE_SIZE = 64;
const INNER_RECORDING_SIZE = 32;
const RECORDING_BORDER_RADIUS = 8;

// Colors
const IOS_SYSTEM_RED = '#FF3B30';
const IDLE_WHITE = '#FFFFFF';

// Animation timing
const TIMING_CONFIG = {
  duration: 200,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

interface GlassRecordButtonProps {
  onPress?: () => void;
  isRecording?: boolean;
  disabled?: boolean;
}

export default function GlassRecordButton({
  onPress,
  isRecording = false,
  disabled = false,
}: GlassRecordButtonProps) {
  // Animation progress (0 = idle, 1 = recording)
  const progress = useSharedValue(0);

  // Track previous state for haptic feedback
  const prevRecording = useSharedValue(isRecording);

  useEffect(() => {
    // Trigger haptic feedback on state change
    if (prevRecording.value !== isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      prevRecording.value = isRecording;
    }

    progress.value = withTiming(isRecording ? 1 : 0, TIMING_CONFIG);
  }, [isRecording]);

  // Animated style for inner shape
  const animatedInnerStyle = useAnimatedStyle(() => {
    const size = interpolate(
      progress.value,
      [0, 1],
      [INNER_IDLE_SIZE, INNER_RECORDING_SIZE]
    );

    const borderRadius = interpolate(
      progress.value,
      [0, 1],
      [INNER_IDLE_SIZE / 2, RECORDING_BORDER_RADIUS]
    );

    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [IDLE_WHITE, IOS_SYSTEM_RED]
    );

    return {
      width: size,
      height: size,
      borderRadius,
      backgroundColor,
    };
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.touchable, disabled && styles.disabled]}
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.8}
        disabled={disabled}
      >
        {/* Outer ring - white stroke only */}
        <View style={styles.outerRing}>
          {/* Inner shape - animated size, color, and border radius */}
          <Animated.View style={[styles.innerShape, animatedInnerStyle]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  outerRing: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: OUTER_STROKE_WIDTH,
    borderColor: IDLE_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  innerShape: {
    width: INNER_IDLE_SIZE,
    height: INNER_IDLE_SIZE,
    borderRadius: INNER_IDLE_SIZE / 2,
    backgroundColor: IDLE_WHITE,
  },
});
