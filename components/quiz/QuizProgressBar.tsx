import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { BrandColors } from '../../constants/BrandColors';

interface QuizProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBackButton?: boolean;
}

const TOTAL_QUESTIONS = 12;
const TRACK_HEIGHT = 14;
const BORDER_RADIUS = TRACK_HEIGHT / 2;

/**
 * QuizProgressBar - Shows quiz progress with animated fill and back button
 * Styled with bordered pill shape matching the reference design
 */
export default function QuizProgressBar({
  currentStep,
  totalSteps = TOTAL_QUESTIONS,
  onBack,
  showBackButton = true,
}: QuizProgressBarProps) {
  const progress = currentStep / totalSteps;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${Math.max(progress * 100, 8)}%`, {
        damping: 15,
        stiffness: 100,
      }),
    };
  }, [progress]);

  return (
    <View style={styles.container}>
      {/* Back button */}
      {showBackButton && onBack && (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={BrandColors.text.primary}
          />
        </Pressable>
      )}

      {/* Progress bar track with border */}
      <View style={styles.trackOuter}>
        <View style={styles.trackInner}>
          {/* Progress fill */}
          <Animated.View style={[styles.fillContainer, animatedStyle]}>
            <LinearGradient
              colors={[
                BrandColors.progressBar.fillGradientStart,
                BrandColors.progressBar.fillGradientEnd,
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.fill}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonPressed: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackOuter: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    padding: 2,
  },
  trackInner: {
    flex: 1,
    height: '100%',
    borderRadius: BORDER_RADIUS - 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  fillContainer: {
    height: '100%',
    borderRadius: BORDER_RADIUS - 2,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    flex: 1,
    height: '100%',
    borderRadius: BORDER_RADIUS - 2,
  },
});
