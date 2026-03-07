import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ImageBackground, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts } from '../constants/Fonts';
import Button3D from '../components/Button3D';
import { useOnboardingStore } from '../store/useOnboardingStore';
import Ribbon from '../assets/images/ribbon.svg';
import TimelapseStar from '../assets/images/timelapse_start.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOTIVATIONAL_MESSAGES = [
  "You just outworked 99% of people.",
  "That's how legends are built.",
  "Locked in. No distractions. Pure focus.",
  "Every grind session counts.",
  "You showed up. That's what matters.",
  "Consistency beats talent every time.",
  "Another session in the bag.",
  "Your future self just said thanks.",
  "Built different. Proved it again.",
  "The grind doesn't lie.",
];

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function GrindCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { grindDurationSeconds } = useLocalSearchParams<{ videoUri: string; grindDurationSeconds: string }>();
  const userName = useOnboardingStore((s) => s.quizAnswers.name);

  const durationSeconds = parseInt(grindDurationSeconds || '0', 10);
  const durationText = formatDuration(durationSeconds);

  const motivationalMessage = useMemo(
    () => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)],
    []
  );

  // Animation values
  const ribbonScale = useSharedValue(0);
  const ribbonOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);
  const starOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const durationOpacity = useSharedValue(0);
  const durationTranslateY = useSharedValue(20);
  const messageOpacity = useSharedValue(0);
  const messageTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    // Staggered entrance animations
    ribbonOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    ribbonScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));

    starOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    starScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 120 }));

    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleTranslateY.value = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    durationOpacity.value = withDelay(800, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    durationTranslateY.value = withDelay(800, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    messageOpacity.value = withDelay(1000, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    messageTranslateY.value = withDelay(1000, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    buttonTranslateY.value = withDelay(1200, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const ribbonAnimStyle = useAnimatedStyle(() => ({
    opacity: ribbonOpacity.value,
    transform: [{ scale: ribbonScale.value }],
  }));

  const starAnimStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
    transform: [{ scale: starScale.value }],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const durationAnimStyle = useAnimatedStyle(() => ({
    opacity: durationOpacity.value,
    transform: [{ translateY: durationTranslateY.value }],
  }));

  const messageAnimStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
    transform: [{ translateY: messageTranslateY.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <ImageBackground
      source={require('../assets/images/night-sky-background.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {/* Ribbon + Star */}
        <View style={styles.badgeArea}>
          <Animated.View style={[styles.ribbonContainer, ribbonAnimStyle]}>
            <Ribbon width={SCREEN_WIDTH} height={SCREEN_WIDTH} />
          </Animated.View>
          <Animated.View style={[styles.starContainer, starAnimStyle]}>
            <TimelapseStar width={SCREEN_WIDTH * 0.4} height={SCREEN_WIDTH * 0.4} />
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View style={titleAnimStyle}>
          <Text style={styles.title}>
            {userName ? `${userName}, you crushed it!` : 'You crushed it!'}
          </Text>
        </Animated.View>

        {/* Duration */}
        <Animated.View style={durationAnimStyle}>
          <Text style={styles.durationLabel}>Grind Duration</Text>
          <Text style={styles.durationValue}>{durationText}</Text>
        </Animated.View>

        {/* Motivational message */}
        <Animated.View style={messageAnimStyle}>
          <Text style={styles.motivationalMessage}>{motivationalMessage}</Text>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Done button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
          <Button3D
            title="Done"
            onPress={() => router.back()}
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  badgeArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    height: SCREEN_WIDTH,
  },
  ribbonContainer: {
    position: 'absolute',
  },
  starContainer: {
    position: 'absolute',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  durationLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  durationValue: {
    fontFamily: Fonts.bold,
    fontSize: 40,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  motivationalMessage: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
});
