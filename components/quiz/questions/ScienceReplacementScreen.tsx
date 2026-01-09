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
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import Button3D from '../../Button3D';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const featherLeft = require('../../../assets/images/feather-left.png');
const featherRight = require('../../../assets/images/feather-right.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AURORA_HEIGHT = 300;

// Animation timing constants
const FEATHER_DURATION = 800;
const STAR_WAVE_DELAY = FEATHER_DURATION + 200;
const STAR_WAVE_DURATION = 150;
const TEXT1_DELAY = STAR_WAVE_DELAY + (STAR_WAVE_DURATION * 5) + 400;
const TEXT2_DELAY = TEXT1_DELAY + 800;
const TEXT3_DELAY = TEXT2_DELAY + 800;
const BUTTON_DELAY = TEXT3_DELAY + 600;

// Accent color (brand pinkish theme)
const ACCENT_COLOR = BrandColors.primary.main; // #FF3B5C

interface ScienceReplacementScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Aurora background SVG component
 */
function AuroraBackground() {
  return (
    <View style={styles.auroraContainer} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={AURORA_HEIGHT}
        style={styles.auroraSvg}
        viewBox={`0 0 ${SCREEN_WIDTH} ${AURORA_HEIGHT}`}
      >
        <Defs>
          <RadialGradient id="leftAuroraGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={BrandColors.primary.main} stopOpacity={0.5} />
            <Stop offset="40%" stopColor={BrandColors.primary.gradientEnd} stopOpacity={0.3} />
            <Stop offset="70%" stopColor={BrandColors.primary.dark} stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="rightAuroraGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={BrandColors.primary.gradientStart} stopOpacity={0.45} />
            <Stop offset="35%" stopColor={BrandColors.primary.main} stopOpacity={0.25} />
            <Stop offset="65%" stopColor={BrandColors.primary.gradientEnd} stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="centerAuroraGlow" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor={BrandColors.primary.main} stopOpacity={0.25} />
            <Stop offset="50%" stopColor={BrandColors.primary.dark} stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={-SCREEN_WIDTH * 0.15}
          cy={-AURORA_HEIGHT * 0.2}
          rx={SCREEN_WIDTH * 0.7}
          ry={AURORA_HEIGHT * 1.3}
          fill="url(#leftAuroraGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH * 1.15}
          cy={-AURORA_HEIGHT * 0.1}
          rx={SCREEN_WIDTH * 0.65}
          ry={AURORA_HEIGHT * 1.2}
          fill="url(#rightAuroraGrad)"
        />
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={-AURORA_HEIGHT * 0.4}
          rx={SCREEN_WIDTH * 0.9}
          ry={AURORA_HEIGHT * 1.0}
          fill="url(#centerAuroraGlow)"
        />
      </Svg>
    </View>
  );
}

/**
 * Animated star component for wave effect
 */
function AnimatedStar({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.5, { duration: STAR_WAVE_DURATION, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: STAR_WAVE_DURATION, easing: Easing.in(Easing.ease) })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.star, animatedStyle]}>
      ★
    </Animated.Text>
  );
}

/**
 * ScienceReplacementScreen - Shows the science behind replacement therapy
 * Explains that quitting is hard and the best method is to replace with WORK
 */
export default function ScienceReplacementScreen({
  onContinue,
  onBack,
}: ScienceReplacementScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const featherTranslateY = useSharedValue(100);
  const featherOpacity = useSharedValue(0);
  const text1Opacity = useSharedValue(0);
  const text2Opacity = useSharedValue(0);
  const text3Opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Feathers roll in from bottom
    featherTranslateY.value = withTiming(0, {
      duration: FEATHER_DURATION,
      easing: Easing.out(Easing.back(1.2)),
    });
    featherOpacity.value = withTiming(1, {
      duration: FEATHER_DURATION * 0.6,
    });

    // 2. Text 1 fades in: "We know that Quitting is hard."
    text1Opacity.value = withDelay(
      TEXT1_DELAY,
      withTiming(1, { duration: 400 })
    );

    // 3. Text 2 fades in: "Science agrees - the best method is to Replace."
    text2Opacity.value = withDelay(
      TEXT2_DELAY,
      withTiming(1, { duration: 400 })
    );

    // 4. Text 3 fades in: "And what better replacement than WORK"
    text3Opacity.value = withDelay(
      TEXT3_DELAY,
      withTiming(1, { duration: 400 })
    );

    // 5. Button appears
    buttonOpacity.value = withDelay(
      BUTTON_DELAY,
      withTiming(1, { duration: 300 })
    );
  }, []);

  // Animated styles
  const featherLeftStyle = useAnimatedStyle(() => ({
    opacity: featherOpacity.value,
    transform: [{ translateY: featherTranslateY.value }],
  }));

  const featherRightStyle = useAnimatedStyle(() => ({
    opacity: featherOpacity.value,
    transform: [{ translateY: featherTranslateY.value }],
  }));

  const text1Style = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
  }));

  const text2Style = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
  }));

  const text3Style = useAnimatedStyle(() => ({
    opacity: text3Opacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Stars for wave animation
  const stars = [0, 1, 2, 3, 4];

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Aurora effect at top */}
      <AuroraBackground />

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
        <View style={styles.mainContent}>
          {/* Hero section with feathers and stars */}
          <View style={styles.heroSection}>
            <View style={styles.featherContainer}>
              {/* Left feather */}
              <Animated.Image
                source={featherLeft}
                style={[styles.featherLeft, featherLeftStyle]}
                resizeMode="contain"
              />

              {/* Stars container */}
              <Animated.View style={[styles.starsContainer, featherLeftStyle]}>
                {stars.map((_, index) => (
                  <AnimatedStar
                    key={index}
                    delay={STAR_WAVE_DELAY + (index * STAR_WAVE_DURATION)}
                  />
                ))}
              </Animated.View>

              {/* Right feather */}
              <Animated.Image
                source={featherRight}
                style={[styles.featherRight, featherRightStyle]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Text sections with sequential fade-in */}
          <View style={styles.textContainer}>
            {/* Text 1: We know that Quitting is hard. */}
            <Animated.View style={[styles.textBlock, text1Style]}>
              <Text style={styles.mainText}>
                We know that{'\n'}
                <Text style={styles.cyanText}>Quitting is hard</Text>.
              </Text>
            </Animated.View>

            {/* Text 2: Science agrees - the best method is to Replace. */}
            <Animated.View style={[styles.textBlock, text2Style]}>
              <Text style={styles.mainText}>
                Science agrees - the{'\n'}best method is to{'\n'}
                <Text style={styles.cyanText}>Replace</Text>.
              </Text>
            </Animated.View>

            {/* Text 3: And what better replacement than WORK */}
            <Animated.View style={[styles.textBlock, text3Style]}>
              <Text style={styles.mainText}>
                And what better{'\n'}replacement than{'\n'}
                <Text style={styles.cyanText}>WORK</Text>?
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* Bottom section with disclaimer and button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
            buttonStyle,
          ]}
        >
          <Text style={styles.disclaimer}>
            Backed by <Text style={styles.disclaimerUnderline}>longitudinal studies</Text>, <Text style={styles.disclaimerUnderline}>systematic reviews</Text>{'\n'}and <Text style={styles.disclaimerUnderline}>behavioral science experts</Text>.
          </Text>
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
  },
  heroSection: {
    paddingTop: 10,
    alignItems: 'center',
  },
  featherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featherLeft: {
    width: 50,
    height: 80,
    marginRight: 0,
  },
  featherRight: {
    width: 50,
    height: 80,
    marginLeft: 0,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 22,
    color: ACCENT_COLOR,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  textBlock: {
    alignItems: 'center',
  },
  mainText: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
  },
  cyanText: {
    color: ACCENT_COLOR,
    fontStyle: 'italic',
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
  disclaimerUnderline: {
    textDecorationLine: 'underline',
  },
});
