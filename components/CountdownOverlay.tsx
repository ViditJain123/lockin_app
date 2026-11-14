import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '../constants/Fonts';
import { T } from '../constants/Theme';
import { countdownTick, lockInPattern } from '../lib/haptics';
import { playSound } from '../lib/sound';

const STEP_MS = 900;
const LOCK_MS = 750;

interface CountdownOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  // 'dark' over the camera, 'light' on the phone-down screen
  variant?: 'dark' | 'light';
}

/**
 * 3 · 2 · 1 · LOCKED IN.
 * Each number lands with a tick sound and a haptic that gets heavier toward
 * zero; the final beat plays the lock-in chime with a clunk-latch-buzz pattern.
 */
export default function CountdownOverlay({ isVisible, onComplete, variant = 'dark' }: CountdownOverlayProps) {
  const [label, setLabel] = useState<string>('3');
  const [isFinal, setIsFinal] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const ring = useSharedValue(0);
  const flash = useSharedValue(0);

  useEffect(() => {
    if (!isVisible) {
      setLabel('3');
      setIsFinal(false);
      opacity.value = 0;
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const pop = () => {
      scale.value = 1.6;
      opacity.value = 0;
      scale.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.6)) });
      opacity.value = withSequence(
        withTiming(1, { duration: 140 }),
        withTiming(1, { duration: STEP_MS - 360 }),
        withTiming(0, { duration: 200 })
      );
      ring.value = 0;
      ring.value = withTiming(1, { duration: STEP_MS, easing: Easing.out(Easing.cubic) });
    };

    const run = async () => {
      for (let n = 3; n >= 1; n--) {
        if (cancelled) return;
        setLabel(String(n));
        pop();
        countdownTick(n);
        playSound('tick');
        await wait(STEP_MS);
      }
      if (cancelled) return;

      setIsFinal(true);
      setLabel('LOCKED IN');
      scale.value = 0.6;
      opacity.value = 1;
      scale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2)) });
      flash.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 520 }));
      playSound('lockin');
      lockInPattern();
      await wait(LOCK_MS);
      if (cancelled) return;
      onComplete();
    };

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isVisible, onComplete, scale, opacity, ring, flash]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.9,
    transform: [{ scale: 0.6 + ring.value * 1.4 }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.85,
  }));

  if (!isVisible) return null;

  const light = variant === 'light';

  return (
    <View style={[styles.container, light ? styles.containerLight : styles.containerDark]} pointerEvents="auto">
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flashStyle]} />
      {!isFinal && <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />}
      <Animated.View style={textStyle}>
        <Text
          style={[
            isFinal ? styles.final : styles.number,
            { color: isFinal ? (light ? T.ink : T.white) : T.orange },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
      {!isFinal && (
        <Text style={[styles.caption, light && styles.captionLight]}>Phone down. Here we go.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  containerDark: {
    backgroundColor: 'rgba(10,10,10,0.6)',
  },
  containerLight: {
    backgroundColor: 'rgba(10,10,10,0.94)',
  },
  flash: {
    backgroundColor: T.orange,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: T.orange,
  },
  number: {
    fontSize: 160,
    lineHeight: 180,
    fontFamily: Fonts.display,
    textAlign: 'center',
  },
  final: {
    fontSize: 64,
    lineHeight: 72,
    fontFamily: Fonts.display,
    letterSpacing: 2,
    textAlign: 'center',
  },
  caption: {
    position: 'absolute',
    bottom: '28%',
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  captionLight: {
    color: T.inkMute,
  },
});
