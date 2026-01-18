import { Ionicons } from '@expo/vector-icons';
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
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import Button3D from '../../Button3D';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { animationReveal } from '../../../lib/haptics';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AURORA_HEIGHT = 350;

// Animation timing
const TEXT_FADE_DURATION = 400;
const NUMBER_ANIMATION_DELAY = 600;
const NUMBER_SCALE_DURATION = 800;

// Blue color scheme
const BLUE_ACCENT = '#00A3FF';
const BLUE_GRADIENT = ['#0088CC', '#00A3FF', '#33B5FF'];

interface LockInSavingsScreenProps {
  screenTime: number;
  desiredScreenTime: number;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Blue Aurora background SVG component
 */
function BlueAuroraBackground() {
  return (
    <View style={styles.auroraContainer} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={AURORA_HEIGHT}
        style={styles.auroraSvg}
        viewBox={`0 0 ${SCREEN_WIDTH} ${AURORA_HEIGHT}`}
      >
        <Defs>
          <RadialGradient id="blueLeftGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0088CC" stopOpacity={0.5} />
            <Stop offset="40%" stopColor="#00A3FF" stopOpacity={0.3} />
            <Stop offset="70%" stopColor="#0066AA" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blueRightGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#33B5FF" stopOpacity={0.45} />
            <Stop offset="35%" stopColor="#00A3FF" stopOpacity={0.25} />
            <Stop offset="65%" stopColor="#0077BB" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blueCenterGlow" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor="#00A3FF" stopOpacity={0.25} />
            <Stop offset="50%" stopColor="#0066AA" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={-SCREEN_WIDTH * 0.15}
          cy={-AURORA_HEIGHT * 0.2}
          rx={SCREEN_WIDTH * 0.7}
          ry={AURORA_HEIGHT * 1.3}
          fill="url(#blueLeftGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH * 1.15}
          cy={-AURORA_HEIGHT * 0.1}
          rx={SCREEN_WIDTH * 0.65}
          ry={AURORA_HEIGHT * 1.2}
          fill="url(#blueRightGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={-AURORA_HEIGHT * 0.4}
          rx={SCREEN_WIDTH * 0.9}
          ry={AURORA_HEIGHT * 1.0}
          fill="url(#blueCenterGlow)"
        />
      </Svg>
    </View>
  );
}

/**
 * Calculate how many years LockIn can help save
 */
function calculateSavings(screenTimeHours: number, desiredScreenTimeHours: number) {
  const savedHoursPerDay = screenTimeHours - desiredScreenTimeHours;
  const savedHoursPerYear = savedHoursPerDay * 365;
  // Over 50 years
  const totalSavedYears = Math.round((savedHoursPerYear * 50) / (24 * 365));
  return Math.max(totalSavedYears, 3); // At least 3 years
}

/**
 * LockInSavingsScreen - Shows how LockIn can help save years of life
 * Uses blue color scheme to represent hope/positive change
 */
export default function LockInSavingsScreen({
  screenTime,
  desiredScreenTime,
  onContinue,
  onBack,
}: LockInSavingsScreenProps) {
  const insets = useSafeAreaInsets();

  const savedYears = calculateSavings(screenTime, desiredScreenTime);

  // Animation values
  const text1Opacity = useSharedValue(0);
  const yearsScale = useSharedValue(0.3);
  const yearsOpacity = useSharedValue(0);
  const text2Opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. First text fades in
    text1Opacity.value = withTiming(1, { duration: TEXT_FADE_DURATION });

    // 2. Big years number scales in (no bounce)
    yearsOpacity.value = withDelay(
      NUMBER_ANIMATION_DELAY,
      withTiming(1, { duration: 300 })
    );
    yearsScale.value = withDelay(
      NUMBER_ANIMATION_DELAY,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 3. Second text fades in
    text2Opacity.value = withDelay(
      NUMBER_ANIMATION_DELAY + NUMBER_SCALE_DURATION,
      withTiming(1, { duration: TEXT_FADE_DURATION })
    );

    // 4. Button appears
    buttonOpacity.value = withDelay(
      NUMBER_ANIMATION_DELAY + NUMBER_SCALE_DURATION + TEXT_FADE_DURATION,
      withTiming(1, { duration: 300 })
    );

    // Trigger haptic when years number finishes scaling
    const hapticTimeout = setTimeout(() => {
      animationReveal();
    }, NUMBER_ANIMATION_DELAY + 500); // 500ms is the scale animation duration

    return () => clearTimeout(hapticTimeout);
  }, []);

  // Animated styles
  const text1Style = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
  }));

  const yearsStyle = useAnimatedStyle(() => ({
    opacity: yearsOpacity.value,
    transform: [{ scale: yearsScale.value }],
  }));

  const text2Style = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
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
      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Blue Aurora effect */}
      <BlueAuroraBackground />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Back button */}
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
        <View style={styles.mainContent}>
          {/* First text block */}
          <Animated.Text style={[styles.introText, text1Style]}>
            The good news is that{'\n'}
            <Text style={styles.blueHighlight}>LockIn</Text> can help you get{'\n'}back
          </Animated.Text>

          {/* Big years number */}
          <Animated.Text style={[styles.yearsNumber, yearsStyle]}>
            {savedYears} years+
          </Animated.Text>

          {/* Second text block */}
          <Animated.Text style={[styles.finalText, text2Style]}>
            of your life free from{'\n'}distractions, and help you{'\n'}achieve your dreams.
          </Animated.Text>
        </View>

        {/* Disclaimer and button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
            buttonStyle,
          ]}
        >
          <Text style={styles.disclaimer}>
            According to your profile combined with LockIn{'\n'}program
          </Text>
          <Button3D title="Continue" onPress={onContinue} variant="blue" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  auroraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: AURORA_HEIGHT,
    zIndex: 1,
    overflow: 'visible',
  },
  auroraSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  introText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  blueHighlight: {
    color: BLUE_ACCENT,
  },
  yearsNumber: {
    fontSize: 72,
    fontFamily: Fonts.bold,
    color: BLUE_ACCENT,
    textAlign: 'center',
    marginBottom: 24,
  },
  finalText: {
    fontSize: 20,
    fontFamily: Fonts.medium,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 30,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: BrandColors.text.muted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
});
