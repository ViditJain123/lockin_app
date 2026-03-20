import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import Button3D from '../../Button3D';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { animationReveal } from '../../../lib/haptics';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const lockinLogo = require('../../../assets/images/logo-no-bg-cropped.png');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);
const AURORA_HEIGHT = 300;

// Animation timing constants
const SECTION_1_DELAY = 0;
const SECTION_1_DURATION = 600;
const SECTION_2_DELAY = SECTION_1_DELAY + SECTION_1_DURATION + 200;
const SECTION_2_DURATION = 600;
const RESEARCH_DELAY = SECTION_2_DELAY + SECTION_2_DURATION + 200;
const RESEARCH_DURATION = 500;
const BUTTON_DELAY = RESEARCH_DELAY + RESEARCH_DURATION + 100;
const BUTTON_DURATION = 400;

// App icon configuration - all icons are white
const APP_ICONS: Record<string, { name: string; iconName: string; iconType: 'fontawesome5' | 'tiktok' }> = {
  tiktok: { name: 'TikTok', iconName: 'tiktok', iconType: 'tiktok' },
  youtube: { name: 'YouTube', iconName: 'youtube', iconType: 'fontawesome5' },
  instagram: { name: 'Instagram', iconName: 'instagram', iconType: 'fontawesome5' },
  mobile_games: { name: 'Games', iconName: 'gamepad', iconType: 'fontawesome5' },
  twitter: { name: 'Twitter', iconName: 'twitter', iconType: 'fontawesome5' },
  reddit: { name: 'Reddit', iconName: 'reddit-alien', iconType: 'fontawesome5' },
  discord: { name: 'Discord', iconName: 'discord', iconType: 'fontawesome5' },
  shopping: { name: 'Shopping', iconName: 'shopping-bag', iconType: 'fontawesome5' },
  other: { name: 'Other', iconName: 'th-large', iconType: 'fontawesome5' },
};

// Tag colors
const NEGATIVE_TAG_COLORS = {
  background: 'rgba(255, 152, 82, 0.2)',
  border: 'rgba(255, 152, 82, 0.6)',
  text: '#FF9852',
  iconBg: 'rgba(255, 152, 82, 0.3)',
};

const POSITIVE_TAG_COLORS = {
  background: 'rgba(82, 152, 255, 0.2)',
  border: 'rgba(82, 152, 255, 0.6)',
  text: '#5298FF',
  iconBg: 'rgba(82, 152, 255, 0.3)',
};

interface SolutionRevealScreenProps {
  selectedApps: string[];
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
 * State Tag component (Anxious, Unfocused, Relaxed, Present)
 */
function StateTag({
  label,
  iconName,
  colors,
}: {
  label: string;
  iconName: string;
  colors: typeof NEGATIVE_TAG_COLORS;
}) {
  return (
    <View style={[styles.stateTag, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.stateTagIcon, { backgroundColor: colors.iconBg }]}>
        <MaterialIcons name={iconName as any} size={16} color={colors.text} />
      </View>
      <Text style={[styles.stateTagText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

/**
 * TikTok Icon SVG component
 */
function TikTokIcon({ size = 40, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.07A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
        fill={color}
      />
    </Svg>
  );
}

/**
 * App Icon component
 */
function AppIcon({ appId }: { appId: string }) {
  const app = APP_ICONS[appId];
  if (!app) return null;

  return (
    <View style={styles.appIconContainer}>
      {app.iconType === 'tiktok' ? (
        <TikTokIcon size={50} color="#FFFFFF" />
      ) : (
        <FontAwesome5 name={app.iconName} size={50} color="#FFFFFF" />
      )}
    </View>
  );
}

/**
 * SolutionRevealScreen - Shows contrast between Current State and With LockIn
 * Displays after AppsQuestionScreen in the onboarding flow
 */
export default function SolutionRevealScreen({
  selectedApps,
  onContinue,
  onBack,
}: SolutionRevealScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const section1Opacity = useSharedValue(0);
  const section1TranslateY = useSharedValue(30);
  const section2Opacity = useSharedValue(0);
  const section2TranslateY = useSharedValue(30);
  const researchOpacity = useSharedValue(0);
  const researchTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);

  // Get top 3 selected apps for display
  const displayApps = selectedApps.slice(0, 3);

  useEffect(() => {
    // Section 1: Current State animates in first
    section1Opacity.value = withDelay(
      SECTION_1_DELAY,
      withTiming(1, { duration: SECTION_1_DURATION, easing: Easing.out(Easing.ease) })
    );
    section1TranslateY.value = withDelay(
      SECTION_1_DELAY,
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // Section 2: With LockIn animates in second
    section2Opacity.value = withDelay(
      SECTION_2_DELAY,
      withTiming(1, { duration: SECTION_2_DURATION, easing: Easing.out(Easing.ease) })
    );
    section2TranslateY.value = withDelay(
      SECTION_2_DELAY,
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // Research box animates in third
    researchOpacity.value = withDelay(
      RESEARCH_DELAY,
      withTiming(1, { duration: RESEARCH_DURATION, easing: Easing.out(Easing.ease) })
    );
    researchTranslateY.value = withDelay(
      RESEARCH_DELAY,
      withSpring(0, { damping: 15, stiffness: 100 })
    );

    // Button fades in last
    buttonOpacity.value = withDelay(
      BUTTON_DELAY,
      withTiming(1, { duration: BUTTON_DURATION })
    );

    // Trigger haptic when "With LockIn" section finishes animating
    const hapticTimeout = setTimeout(() => {
      animationReveal();
    }, SECTION_2_DELAY + SECTION_2_DURATION);

    return () => clearTimeout(hapticTimeout);
  }, []);

  // Animated styles
  const section1Style = useAnimatedStyle(() => ({
    opacity: section1Opacity.value,
    transform: [{ translateY: section1TranslateY.value }],
  }));

  const section2Style = useAnimatedStyle(() => ({
    opacity: section2Opacity.value,
    transform: [{ translateY: section2TranslateY.value }],
  }));

  const researchStyle = useAnimatedStyle(() => ({
    opacity: researchOpacity.value,
    transform: [{ translateY: researchTranslateY.value }],
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

      {/* Aurora effect at top */}
      <AuroraBackground />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Header with back button only */}
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
          {/* Section 1: Current State */}
          <View style={styles.sectionContainer}>
          <Animated.View style={[styles.section, section1Style]}>
            <Text style={styles.sectionTitle}>Current State</Text>
            
            {/* App Icons Row */}
            <View style={styles.appIconsRow}>
              {displayApps.map((appId) => (
                <AppIcon key={appId} appId={appId} />
              ))}
            </View>

            {/* Negative State Tags */}
            <View style={styles.tagsRow}>
              <StateTag label="Anxious" iconName="sentiment-dissatisfied" colors={NEGATIVE_TAG_COLORS} />
              <StateTag label="Unfocused" iconName="blur-on" colors={NEGATIVE_TAG_COLORS} />
            </View>
          </Animated.View>

              {/* Horizontal divider line */}
              <View style={styles.dividerLine} />
          
          {/* Section 2: With LockIn */}
          <Animated.View style={[styles.section, section2Style]}>
            <View style={styles.withLockinHeader}>
              <Text style={styles.withText}>With </Text>
              <Image source={lockinLogo} style={styles.lockinLogo} resizeMode="contain" />
            </View>

            {/* Positive State Tags */}
            <View style={styles.tagsRow}>
              <StateTag label="Relaxed" iconName="spa" colors={POSITIVE_TAG_COLORS} />
              <StateTag label="Present" iconName="person" colors={POSITIVE_TAG_COLORS} />
            </View>
          </Animated.View>

          </View>

          {/* The Research Box */}
          <Animated.View style={[styles.researchBox, researchStyle]}>
            <View style={styles.researchHeader}>
              <MaterialIcons name="science" size={20} color={BrandColors.text.secondary} />
              <Text style={styles.researchTitle}>The <Text style={styles.researchTitleBold}>Research</Text></Text>
            </View>
            <Text style={styles.researchText}>
              A 2024 study of 252,337 people found problematic social media use was associated with higher anxiety. From{' '}
              <Text style={styles.researchSource}>BioMed Central</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Continue button */}
        <Animated.View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 32 }, buttonStyle]}>
          <Button3D
            title="Continue"
            onPress={onContinue}
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 24,
  },
  sectionContainer: {
    marginTop: -36,
  },
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
    justifyContent: 'center',
    gap: 32,
  },
  section: {
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
  },
  appIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
  },
  appIconContainer: {
    width: 90,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  stateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  stateTagIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateTagText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  withLockinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withText: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
  },
  lockinLogo: {
    width: 130,
    height: 40,
    marginTop: 16,
    marginLeft: -6
  },
  researchBox: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    marginTop: 56,
  },
  researchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  researchTitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
  },
  researchTitleBold: {
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
  },
  researchText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    lineHeight: 22,
  },
  researchSource: {
    color: BrandColors.primary.main,
    fontFamily: Fonts.medium,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
