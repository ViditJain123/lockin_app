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

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation timing
const TEXT_FADE_DURATION = 400;
const NUMBER_ANIMATION_DELAY = 600;
const NUMBER_SCALE_DURATION = 800;

// Orange/warm colors for this screen
const ACCENT_COLOR = '#FF6B35';

const AURORA_HEIGHT = 350;

/**
 * Orange Aurora background SVG component
 */
function OrangeAuroraBackground() {
  return (
    <View style={auroraStyles.auroraContainer} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={AURORA_HEIGHT}
        style={auroraStyles.auroraSvg}
        viewBox={`0 0 ${SCREEN_WIDTH} ${AURORA_HEIGHT}`}
      >
        <Defs>
          <RadialGradient id="orangeLeftGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6B35" stopOpacity={0.5} />
            <Stop offset="40%" stopColor="#FF8C42" stopOpacity={0.3} />
            <Stop offset="70%" stopColor="#E85D2C" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="orangeRightGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF9147" stopOpacity={0.45} />
            <Stop offset="35%" stopColor="#FF6B35" stopOpacity={0.25} />
            <Stop offset="65%" stopColor="#C44A1D" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="orangeCenterGlow" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor="#FF6B35" stopOpacity={0.25} />
            <Stop offset="50%" stopColor="#E85D2C" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={-SCREEN_WIDTH * 0.15}
          cy={-AURORA_HEIGHT * 0.2}
          rx={SCREEN_WIDTH * 0.7}
          ry={AURORA_HEIGHT * 1.3}
          fill="url(#orangeLeftGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH * 1.15}
          cy={-AURORA_HEIGHT * 0.1}
          rx={SCREEN_WIDTH * 0.65}
          ry={AURORA_HEIGHT * 1.2}
          fill="url(#orangeRightGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={-AURORA_HEIGHT * 0.4}
          rx={SCREEN_WIDTH * 0.9}
          ry={AURORA_HEIGHT * 1.0}
          fill="url(#orangeCenterGlow)"
        />
      </Svg>
    </View>
  );
}

const auroraStyles = StyleSheet.create({
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
});

interface LifetimeUsageScreenProps {
  screenTime: number;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Calculate lifetime phone usage statistics
 */
function calculateUsageStats(screenTimeHours: number) {
  // Days spent on phone per year
  const hoursPerYear = screenTimeHours * 365;
  const daysPerYear = Math.round(hoursPerYear / 24);

  // Assuming ~50 years of phone use remaining (average lifespan consideration)
  const totalYears = Math.round((hoursPerYear * 50) / (24 * 365));

  return { daysPerYear, totalYears };
}

/**
 * LifetimeUsageScreen - Shows shocking lifetime phone usage statistics
 * Uses orange/warm color scheme to create urgency
 */
export default function LifetimeUsageScreen({
  screenTime,
  onContinue,
  onBack,
}: LifetimeUsageScreenProps) {
  const insets = useSafeAreaInsets();

  const { daysPerYear, totalYears } = calculateUsageStats(screenTime);

  // Animation values
  const text1Opacity = useSharedValue(0);
  const text2Opacity = useSharedValue(0);
  const yearsScale = useSharedValue(0.3);
  const yearsOpacity = useSharedValue(0);
  const text3Opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. First text fades in
    text1Opacity.value = withTiming(1, { duration: TEXT_FADE_DURATION });

    // 2. Second text fades in
    text2Opacity.value = withDelay(
      TEXT_FADE_DURATION + 200,
      withTiming(1, { duration: TEXT_FADE_DURATION })
    );

    // 3. Big years number scales in (no bounce)
    yearsOpacity.value = withDelay(
      NUMBER_ANIMATION_DELAY,
      withTiming(1, { duration: 300 })
    );
    yearsScale.value = withDelay(
      NUMBER_ANIMATION_DELAY,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 4. Final text fades in
    text3Opacity.value = withDelay(
      NUMBER_ANIMATION_DELAY + NUMBER_SCALE_DURATION,
      withTiming(1, { duration: TEXT_FADE_DURATION })
    );

    // 5. Button appears
    buttonOpacity.value = withDelay(
      NUMBER_ANIMATION_DELAY + NUMBER_SCALE_DURATION + TEXT_FADE_DURATION,
      withTiming(1, { duration: 300 })
    );
  }, []);

  // Animated styles
  const text1Style = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
  }));

  const text2Style = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
  }));

  const yearsStyle = useAnimatedStyle(() => ({
    opacity: yearsOpacity.value,
    transform: [{ scale: yearsScale.value }],
  }));

  const text3Style = useAnimatedStyle(() => ({
    opacity: text3Opacity.value,
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

      {/* Orange Aurora effect */}
      <OrangeAuroraBackground />

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
            At your current rate, you'll{'\n'}spend{' '}
            <Text style={styles.orangeHighlight}>{daysPerYear} days</Text> on your phone{'\n'}
            over the next year
          </Animated.Text>

          {/* Second text block */}
          <Animated.Text style={[styles.transitionText, text2Style]}>
            Which means you're on track to{'\n'}spend
          </Animated.Text>

          {/* Big years number */}
          <Animated.Text style={[styles.yearsNumber, yearsStyle]}>
            {totalYears} years
          </Animated.Text>

          {/* Final text */}
          <Animated.Text style={[styles.finalText, text3Style]}>
            of your life looking down at{'\n'}your phone.{'\n'}
            Yep, you read this right.
          </Animated.Text>
        </View>

        {/* Continue button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
            buttonStyle,
          ]}
        >
          <Button3D title="Continue" onPress={onContinue} variant="orange" />
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  introText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 32,
  },
  orangeHighlight: {
    color: ACCENT_COLOR,
  },
  transitionText: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  yearsNumber: {
    fontSize: 72,
    fontFamily: Fonts.bold,
    color: ACCENT_COLOR,
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
});
