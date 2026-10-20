import React, { useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Button3D from './Button3D';
import Mascot from './Mascot';

import { BrandColors } from '../constants/BrandColors';
import { Fonts } from '../constants/Fonts';
import { mascotLand, mascotWink, optionSelect } from '../lib/haptics';

// Opening screen colours: white background with ink text and orange accents
const theme = {
  background: BrandColors.palette.white,
  text: BrandColors.palette.ink,
  accent: BrandColors.palette.orange,
} as const;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MASCOT_SIZE = SCREEN_WIDTH * 0.42;

// Intro timeline (ms): mascot pops in, winks, then the button and tagline follow
const LAND_AT = 280;
const WINK_AT = 480;
const WORDMARK_AT = 720;
const BUTTON_AT = 820;
const TAGLINE_AT = 960;

// Fades an element in while sliding it `distance` px into place
function useFadeUp(progress: SharedValue<number>, distance: number) {
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const mascotIn = useSharedValue(reduceMotion ? 1 : 0);
  const rightEyeOpen = useSharedValue(1);
  const tilt = useSharedValue(0);
  const wordmarkIn = useSharedValue(reduceMotion ? 1 : 0);
  const buttonIn = useSharedValue(reduceMotion ? 1 : 0);
  const taglineIn = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;

    mascotIn.value = withSpring(1, { damping: 11, stiffness: 180, mass: 0.6 });

    rightEyeOpen.value = withDelay(
      WINK_AT,
      withSequence(
        withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }),
        withDelay(90, withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }))
      )
    );
    tilt.value = withDelay(
      WINK_AT,
      withSequence(
        withTiming(-6, { duration: 80 }),
        withDelay(90, withSpring(0, { damping: 8, stiffness: 200 }))
      )
    );

    const reveal = (delay: number) =>
      withDelay(delay, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }));
    wordmarkIn.value = reveal(WORDMARK_AT);
    buttonIn.value = reveal(BUTTON_AT);
    taglineIn.value = reveal(TAGLINE_AT);

    const timers = [
      setTimeout(mascotLand, LAND_AT),
      setTimeout(mascotWink, WINK_AT + 80),
      setTimeout(optionSelect, TAGLINE_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: Math.min(mascotIn.value * 2, 1),
    transform: [
      { translateY: (1 - mascotIn.value) * 80 },
      { scale: 0.4 + mascotIn.value * 0.6 },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const wordmarkStyle = useFadeUp(wordmarkIn, 10);
  const buttonStyle = useFadeUp(buttonIn, 40);
  const taglineStyle = useFadeUp(taglineIn, -16);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + SCREEN_HEIGHT * 0.12 }]}>
        {/* Tagline */}
        <Animated.View style={[styles.textContainer, taglineStyle]}>
          <Text style={styles.taglineTop}>IT'S TIME TO</Text>
          <Text style={styles.taglineBottom}>LOCK IN</Text>
        </Animated.View>

        {/* Logo: mascot + one-line wordmark */}
        <View style={styles.logoContainer}>
          <Animated.View style={mascotStyle}>
            <Mascot size={MASCOT_SIZE} rightEyeOpen={rightEyeOpen} />
          </Animated.View>
          <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
            LOCKIN <Text style={styles.wordmarkAccent}>CLUB</Text>
          </Animated.Text>
        </View>

        {/* Get Started Button */}
        <Animated.View
          style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }, buttonStyle]}
        >
          <Button3D
            title="Get Started"
            onPress={onComplete}
            icon={<Text style={styles.buttonArrow}>→</Text>}
            iconPosition="right"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  taglineTop: {
    fontSize: 32,
    fontFamily: Fonts.interBold,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  taglineBottom: {
    fontSize: 32,
    fontFamily: Fonts.interExtraBold,
    color: theme.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    marginTop: 20,
    fontSize: 30,
    fontFamily: Fonts.dmSansBold,
    color: theme.text,
    letterSpacing: 0.5,
  },
  wordmarkAccent: {
    color: theme.accent,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 32,
  },
  buttonArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: Fonts.interSemiBold,
  },
});
