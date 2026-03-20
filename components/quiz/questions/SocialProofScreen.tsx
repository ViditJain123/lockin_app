import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import Button3D from '../../Button3D';
import GoalTag from '../GoalTag';
import ReviewCard from '../ReviewCard';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const featherLeft = require('../../../assets/images/feather-left.png');
const featherRight = require('../../../assets/images/feather-right.png');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);
const AURORA_HEIGHT = 300;

// Animation timing constants
const FEATHER_DURATION = 800;
const TEXT_FADE_DELAY = FEATHER_DURATION;
const TEXT_FADE_DURATION = 400;
const DIGIT_WAVE_DELAY = TEXT_FADE_DELAY + TEXT_FADE_DURATION;
const DIGIT_WAVE_DURATION = 200;
const CONTENT_APPEAR_DELAY = DIGIT_WAVE_DELAY + (DIGIT_WAVE_DURATION * 8);

// Fake reviews data
const REVIEWS = [
  {
    id: '1',
    name: 'Tymofii S.',
    username: '@whostymo',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    text: 'This app is amazing!! I\'m down to 40 minutes or less TikTok per day from 5 hours per day!!',
  },
  {
    id: '2',
    name: 'Colbee T.',
    username: '@jjfvcnejec',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    text: '"It\'s better than I thought because now you can\'t immediately scroll in the morning"',
  },
  {
    id: '3',
    name: 'Marcus W.',
    username: '@marcusw_',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    text: 'Finally got my screen time under control. The accountability really works!',
  },
];

interface SocialProofScreenProps {
  userName: string;
  selectedGoals: string[];
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
 * Animated digit component for wave effect
 */
function AnimatedDigit({
  char,
  delay
}: {
  char: string;
  delay: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.4, { duration: DIGIT_WAVE_DURATION, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: DIGIT_WAVE_DURATION, easing: Easing.in(Easing.ease) })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.heroNumber, animatedStyle]}>
      {char}
    </Animated.Text>
  );
}

/**
 * SocialProofScreen - Shows social proof with reviews and goal tags
 * Step 5 in the onboarding quiz funnel
 */
export default function SocialProofScreen({
  userName,
  selectedGoals,
  onContinue,
  onBack,
}: SocialProofScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const featherTranslateY = useSharedValue(100);
  const featherOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Feathers roll in from bottom
    featherTranslateY.value = withTiming(0, {
      duration: FEATHER_DURATION,
      easing: Easing.out(Easing.back(1.2)),
    });
    featherOpacity.value = withTiming(1, {
      duration: FEATHER_DURATION * 0.6,
    });

    // 2. Text fades in and scales up after feathers
    textOpacity.value = withDelay(
      TEXT_FADE_DELAY,
      withTiming(1, { duration: TEXT_FADE_DURATION })
    );
    textScale.value = withDelay(
      TEXT_FADE_DELAY,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // 3. Content appears after digit wave animation
    contentOpacity.value = withDelay(
      CONTENT_APPEAR_DELAY,
      withTiming(1, { duration: 400 })
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

  const textContainerStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Digits for wave animation: "1,000"
  const digits = ['1', ',', '0', '0', '0'];

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

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero section with feathers */}
          <View style={styles.heroSection}>
            <View style={styles.featherContainer}>
              {/* Left feather */}
              <Animated.Image
                source={featherLeft}
                style={[styles.featherLeft, featherLeftStyle]}
                resizeMode="contain"
              />

              {/* Text container */}
              <Animated.View style={[styles.heroTextContainer, textContainerStyle]}>
                <View style={styles.heroTextRow}>
                  <Text style={styles.heroText}>Over </Text>
                  {digits.map((char, index) => (
                    <AnimatedDigit
                      key={index}
                      char={char}
                      delay={DIGIT_WAVE_DELAY + (index * DIGIT_WAVE_DURATION)}
                    />
                  ))}
                  <Text style={styles.heroText}> People</Text>
                </View>
                <Text style={styles.heroSubtext}>
                  started with the same goals!
                </Text>
              </Animated.View>

              {/* Right feather */}
              <Animated.Image
                source={featherRight}
                style={[styles.featherRight, featherRightStyle]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Animated content section */}
          <Animated.View style={contentStyle}>
            {/* Dynamic goal tags */}
            <View style={styles.tagsContainer}>
              {selectedGoals.slice(0, 3).map((goalId) => (
                <GoalTag key={goalId} goalId={goalId} />
              ))}
            </View>

            {/* Reviews */}
            <View style={styles.reviewsContainer}>
              {REVIEWS.map((review) => (
                <ReviewCard
                  key={review.id}
                  name={review.name}
                  username={review.username}
                  avatarUrl={review.avatar}
                  text={review.text}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Fixed button at bottom - also animated */}
        <Animated.View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 32 }, contentStyle]}>
          <Button3D
            title="I'm next"
            onPress={onContinue}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  heroTextContainer: {
    alignItems: 'center',
  },
  heroTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
    textAlign: 'center',
  },
  heroNumber: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
  },
  heroSubtext: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 12,
  },
  reviewsContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
