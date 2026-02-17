import Button3D from '@/components/Button3D';
import { Fonts } from '@/constants/Fonts';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RibbonSvg from '@/assets/images/ribbon.svg';
import TimelapseStar from '@/assets/images/timelapse_start.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOTIVATIONAL_MESSAGES = [
  'Take a breath.\nProud of you, {name}!',
  'Well done.\nProud of you, {name}!',
  'Small wins compound.\nProud of you, {name}!',
];

function formatCompactDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}hr ${minutes}min`;
    }
    return `${hours}hr`;
  }

  return `${Math.max(1, minutes)}min`;
}

export default function GrindCompleteScreen() {
  const { videoUri, grindDurationSeconds } = useLocalSearchParams<{
    videoUri: string;
    grindDurationSeconds: string;
  }>();

  const insets = useSafeAreaInsets();
  const userName = useOnboardingStore((s) => s.quizAnswers.name) || 'champ';
  const grindDuration = grindDurationSeconds ? parseInt(grindDurationSeconds, 10) : 0;

  const motivationalMessage = useMemo(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    return MOTIVATIONAL_MESSAGES[idx].replace('{name}', userName);
  }, [userName]);

  const durationText = `You locked in for ${formatCompactDuration(grindDuration)}`;

  const handleViewGrind = () => {
    router.replace({
      pathname: '/preview' as const,
      params: {
        videoUri,
        grindDurationSeconds: String(grindDuration),
      },
    } as any);
  };

  // Ribbon proportional height: assume ~1.2:1 aspect ratio for the ribbon SVG
  const ribbonWidth = SCREEN_WIDTH;
  const ribbonHeight = ribbonWidth * 1.2;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/night-sky-background.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        {/* Content */}
        <View style={styles.content}>
          {/* Ribbon + Star section */}
          <Animated.View
            entering={FadeIn.duration(800).delay(200)}
            style={styles.ribbonContainer}
          >
            <RibbonSvg width={ribbonWidth} height={ribbonHeight} />
            <View style={styles.starContainer}>
              <TimelapseStar width={120} height={122} />
            </View>
          </Animated.View>

          {/* Text section */}
          <View style={styles.textContainer}>
            <Animated.Text
              entering={FadeInUp.duration(600).delay(600)}
              style={styles.durationText}
            >
              {durationText}
            </Animated.Text>

            <Animated.Text
              entering={FadeInUp.duration(600).delay(900)}
              style={styles.motivationalText}
            >
              {motivationalMessage}
            </Animated.Text>
          </View>
        </View>

        {/* Bottom button */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(1200)}
          style={[styles.buttonContainer, { paddingBottom: insets.bottom + 24 }]}
        >
          <Button3D title="View Grind" onPress={handleViewGrind} />
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -20,
  },
  durationText: {
    fontSize: 18,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  motivationalText: {
    fontSize: 28,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  buttonContainer: {
    paddingHorizontal: 32,
  },
});
