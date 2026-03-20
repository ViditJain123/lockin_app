import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { animationReveal } from '../../../lib/haptics';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Animation timing constants
const TEXT_FADE_DURATION = 400;
const BAR_ANIMATION_DELAY = 500;
const BAR_ANIMATION_DURATION = 1200;

// Fixed average percentage
const AVERAGE_PERCENTAGE = 33;

// Bar dimensions
const BAR_MAX_HEIGHT = 220;
const BAR_WIDTH = 80;

interface DependenceResultScreenProps {
  screenTime: number;
  desiredScreenTime: number;
  problematicApps: string[];
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Calculate a "fake" dependence score based on quiz answers.
 * The result is always higher than average (33%) to create urgency.
 * Returns a value between 50-85%.
 */
function calculateDependenceScore(
  screenTime: number,
  desiredScreenTime: number,
  problematicApps: string[]
): number {
  // Base score starts at 50%
  let score = 50;

  // Add points based on screen time (1-12+ hours mapped to 0-15 points)
  const screenTimeContribution = Math.min((screenTime / 12) * 15, 15);
  score += screenTimeContribution;

  // Add points based on the gap between desired and actual screen time
  const screenTimeGap = screenTime - desiredScreenTime;
  const gapContribution = Math.min(Math.max(screenTimeGap * 2, 0), 10);
  score += gapContribution;

  // Add points based on number of problematic apps (0-5+ apps mapped to 0-10 points)
  const appsContribution = Math.min(problematicApps.length * 2, 10);
  score += appsContribution;

  // Clamp the final score between 50 and 85
  return Math.min(Math.max(Math.round(score), 50), 85);
}

/**
 * DependenceResultScreen - Shows phone dependence comparison results
 * Displays animated bar graphs comparing user's result vs average
 */
export default function DependenceResultScreen({
  screenTime,
  desiredScreenTime,
  problematicApps,
  onContinue,
  onBack,
}: DependenceResultScreenProps) {
  const insets = useSafeAreaInsets();

  // Calculate user's dependence score
  const userScore = calculateDependenceScore(
    screenTime,
    desiredScreenTime,
    problematicApps
  );
  const differenceFromAverage = userScore - AVERAGE_PERCENTAGE;

  // Animation values
  const textOpacity = useSharedValue(0);
  const userBarHeight = useSharedValue(0);
  const averageBarHeight = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  // Target heights for bars (percentage of max height)
  const userBarTargetHeight = (userScore / 100) * BAR_MAX_HEIGHT;
  const averageBarTargetHeight = (AVERAGE_PERCENTAGE / 100) * BAR_MAX_HEIGHT;

  useEffect(() => {
    // 1. Text fades in immediately
    textOpacity.value = withTiming(1, { duration: TEXT_FADE_DURATION });

    // 2. Bars animate after a delay
    userBarHeight.value = withDelay(
      BAR_ANIMATION_DELAY,
      withTiming(userBarTargetHeight, {
        duration: BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    averageBarHeight.value = withDelay(
      BAR_ANIMATION_DELAY,
      withTiming(averageBarTargetHeight, {
        duration: BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );

    // 3. Button appears after bars finish
    buttonOpacity.value = withDelay(
      BAR_ANIMATION_DELAY + BAR_ANIMATION_DURATION,
      withTiming(1, { duration: 300 })
    );

    // Trigger haptic when bars finish animating
    const hapticTimeout = setTimeout(() => {
      animationReveal();
    }, BAR_ANIMATION_DELAY + BAR_ANIMATION_DURATION);

    return () => clearTimeout(hapticTimeout);
  }, []);

  // Animated styles
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const userBarStyle = useAnimatedStyle(() => ({
    height: userBarHeight.value,
  }));

  const averageBarStyle = useAnimatedStyle(() => ({
    height: averageBarHeight.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Cloud/Aurora effect at top */}
      <CloudBackground height={280} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Custom header - back button only */}
        <View style={styles.header}>
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
        </View>

        {/* Main content */}
        <Animated.View style={[styles.mainContent, textStyle]}>
          {/* Title */}
          <Text style={styles.title}>It doesn't look good so far...</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Your response indicates a clear{'\n'}
            <Text style={styles.highlightText}>negative dependence</Text> on your{'\n'}
            phone*
          </Text>

          {/* Bar graph section */}
          <View style={styles.barGraphContainer}>
            {/* User Result Bar */}
            <View style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <Animated.View style={[styles.barContainer, userBarStyle]}>
                  <LinearGradient
                    colors={['#FF8C42', '#FF6B35', '#E85D2C']}
                    style={styles.barGradient}
                  >
                    <Text style={styles.barPercentage}>{userScore}%</Text>
                  </LinearGradient>
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>Your Result</Text>
            </View>

            {/* Average Bar */}
            <View style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <Animated.View style={[styles.barContainer, averageBarStyle]}>
                  <LinearGradient
                    colors={['#B8C6DB', '#87A4C5', '#6B95BC']}
                    style={styles.barGradient}
                  >
                    <Text style={styles.barPercentage}>{AVERAGE_PERCENTAGE}%</Text>
                  </LinearGradient>
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>Average</Text>
            </View>
          </View>

          {/* Difference text */}
          <Text style={styles.differenceText}>
            <Text style={styles.differenceHighlight}>{differenceFromAverage}% higher</Text>
            {' '}than the average!
          </Text>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            *This is not a psychological diagnosis
          </Text>
        </Animated.View>

        {/* Continue button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
            buttonStyle,
          ]}
        >
          <Button3D title="Continue" onPress={onContinue} />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  highlightText: {
    color: '#FF6B35',
    fontFamily: Fonts.semiBold,
  },
  barGraphContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 40,
    marginBottom: 32,
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  barContainer: {
    width: BAR_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 16,
    borderRadius: 12,
  },
  barPercentage: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
  },
  barLabel: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
  },
  differenceText: {
    fontSize: 20,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  differenceHighlight: {
    color: '#FF6B35',
    fontFamily: Fonts.bold,
  },
  disclaimer: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
