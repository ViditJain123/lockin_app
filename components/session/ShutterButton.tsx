import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';
import { holdTick, optionSelect } from '@/lib/haptics';
import { playSound } from '@/lib/sound';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const HOLD_TO_STOP_MS = 1200;
const SIZE = 92;
const STROKE = 5;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

interface ShutterButtonProps {
  isRecording: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  // Shown when the user lets go before the hold completes
  onHoldCancelled?: () => void;
  // Dark camera chrome vs. light phone-down screen
  variant?: 'dark' | 'light';
}

/**
 * Idle: tap to start. Recording: press and hold to stop — an orange ring fills
 * with rising haptic ticks, so a session can't end by accident.
 */
export default function ShutterButton({
  isRecording,
  disabled,
  onStart,
  onStop,
  onHoldCancelled,
  variant = 'dark',
}: ShutterButtonProps) {
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const breathe = useSharedValue(0);
  const ticksRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);

  // Idle "breathing" glow invites the first tap
  useEffect(() => {
    if (isRecording || disabled) {
      cancelAnimation(breathe);
      breathe.value = withTiming(0, { duration: 200 });
      return;
    }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [isRecording, disabled, breathe]);

  const clearTicks = () => {
    ticksRef.current.forEach(clearTimeout);
    ticksRef.current = [];
  };

  useEffect(() => clearTicks, []);

  const finishHold = () => {
    completedRef.current = true;
    clearTicks();
    onStop();
  };

  const handlePressIn = () => {
    if (disabled) return;
    pressScale.value = withTiming(0.92, { duration: 120 });
    if (!isRecording) return;

    completedRef.current = false;
    progress.value = 0;
    progress.value = withTiming(1, { duration: HOLD_TO_STOP_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(finishHold)();
    });
    // Ticks speed up as the ring closes
    [0, 0.3, 0.52, 0.7, 0.82, 0.92].forEach((p) => {
      ticksRef.current.push(
        setTimeout(() => {
          holdTick(p);
          playSound('blip');
        }, p * HOLD_TO_STOP_MS)
      );
    });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 160 });
    if (!isRecording || completedRef.current) return;
    clearTicks();
    if (progress.value > 0 && progress.value < 1) {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 220 });
      onHoldCancelled?.();
    }
  };

  const handlePress = () => {
    if (disabled || isRecording) return;
    optionSelect();
    onStart();
  };

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + breathe.value * 0.45,
    transform: [{ scale: 1 + breathe.value * 0.12 }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    // Recording: the orange dot morphs into a rounded "stop" square
    borderRadius: withTiming(isRecording ? 12 : 34),
    width: withTiming(isRecording ? 34 : 68),
    height: withTiming(isRecording ? 34 : 68),
  }));

  const ringBase = variant === 'dark' ? 'rgba(255,255,255,0.9)' : T.ink;

  return (
    <View style={styles.wrap}>
      {!isRecording && <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Hold to stop and save' : 'Start lock-in'}
        hitSlop={10}
      >
        <Animated.View style={[styles.button, scaleStyle, disabled && styles.disabled]}>
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={ringBase} strokeWidth={STROKE} fill="none" opacity={isRecording ? 0.35 : 1} />
            {isRecording && (
              <AnimatedCircle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                stroke={T.orange}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${CIRC} ${CIRC}`}
                animatedProps={ringProps}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            )}
          </Svg>
          <Animated.View style={[styles.inner, innerStyle]} />
        </Animated.View>
      </Pressable>
      <Text style={[styles.hint, variant === 'light' && styles.hintLight]}>
        {isRecording ? 'Hold to stop' : 'Tap to lock in'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -8,
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    backgroundColor: T.orangeGlow,
  },
  button: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    backgroundColor: T.orange,
  },
  hint: {
    marginTop: 10,
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
  },
  hintLight: {
    color: T.inkMute,
  },
});
