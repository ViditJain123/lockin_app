import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

// Button sizing - iOS 26 time-lapse style
const OUTER_SIZE = 80;
const RING_STROKE = 4;
const RING_RADIUS = (OUTER_SIZE - RING_STROKE) / 2;
const INNER_IDLE_SIZE = 62;
const INNER_RECORDING_SIZE = 30;
const RECORDING_BORDER_RADIUS = 7;

// Colors
const IOS_SYSTEM_RED = '#FF3B30';
const RING_COLOR = '#FFFFFF';

// Animation timing
const MORPH_TIMING = {
  duration: 220,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};
const RING_ROTATION_MS = 16000;

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
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const prevRecording = useSharedValue(isRecording);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: RING_ROTATION_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (prevRecording.value !== isRecording) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      prevRecording.value = isRecording;
    }
    progress.value = withTiming(isRecording ? 1 : 0, MORPH_TIMING);
  }, [isRecording]);

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
    return {
      width: size,
      height: size,
      borderRadius,
    };
  });

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.touchable, disabled && styles.disabled]}
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.85}
        disabled={disabled}
      >
        <Animated.View style={[styles.ringContainer, animatedRingStyle]}>
          <Svg width={OUTER_SIZE} height={OUTER_SIZE}>
            <Circle
              cx={OUTER_SIZE / 2}
              cy={OUTER_SIZE / 2}
              r={RING_RADIUS}
              stroke={RING_COLOR}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray="1 6"
              fill="none"
            />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.innerShape, animatedInnerStyle]} />
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
  ringContainer: {
    position: 'absolute',
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerShape: {
    width: INNER_IDLE_SIZE,
    height: INNER_IDLE_SIZE,
    borderRadius: INNER_IDLE_SIZE / 2,
    backgroundColor: IOS_SYSTEM_RED,
  },
});
