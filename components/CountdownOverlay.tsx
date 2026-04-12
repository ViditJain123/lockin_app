import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Fonts } from '../constants/Fonts';

// Animation configuration
const ANIMATION_DURATION = 900; // ms for shrink animation
const TOTAL_PER_NUMBER = 1000; // ms total per number (900ms animation + 100ms gap)

// Scale and opacity values
const INITIAL_SCALE = 1.5;
const FINAL_SCALE = 0.3;

// iOS-style easing curves
const SHRINK_EASING = Easing.bezier(0.4, 0.0, 0.2, 1);
const FADE_EASING = Easing.out(Easing.cubic);

interface CountdownOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
}

export default function CountdownOverlay({ isVisible, onComplete }: CountdownOverlayProps) {
  const [currentNumber, setCurrentNumber] = useState(3);

  const scale = useSharedValue(INITIAL_SCALE);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when hidden
      setCurrentNumber(3);
      scale.value = INITIAL_SCALE;
      opacity.value = 1;
      return;
    }

    let isCancelled = false;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    const animateNumber = () => {
      // Reset to initial values
      scale.value = INITIAL_SCALE;
      opacity.value = 1;

      // Animate shrink
      scale.value = withTiming(FINAL_SCALE, {
        duration: ANIMATION_DURATION,
        easing: SHRINK_EASING,
      });

      // Animate fade
      opacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: FADE_EASING,
      });
    };

    const runSequence = async () => {
      for (let num = 3; num >= 1; num--) {
        if (isCancelled) return;

        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Hide content before changing number to prevent flash of old number
        opacity.value = 0;

        // Update current number
        setCurrentNumber(num);

        // Wait for React to render the new number before making it visible
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        if (isCancelled) return;

        // Now run the animation with the new number visible
        animateNumber();

        // Wait for interval
        await new Promise<void>((resolve) => {
          const id = setTimeout(resolve, TOTAL_PER_NUMBER);
          timeoutIds.push(id);
        });
      }

      if (!isCancelled) {
        onComplete();
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
      timeoutIds.forEach(clearTimeout);
    };
  }, [isVisible, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={styles.container}>
      <Animated.Text style={[styles.numberText, animatedStyle]}>
        {currentNumber}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
  },
  numberText: {
    fontSize: 200,
    fontFamily: Fonts.bold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
});
