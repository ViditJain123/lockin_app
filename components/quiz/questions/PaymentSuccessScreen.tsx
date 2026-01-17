import React, { useEffect } from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PaymentSuccessScreenProps {
  userName: string;
  onContinue: () => void;
}

export default function PaymentSuccessScreen({
  userName,
  onContinue,
}: PaymentSuccessScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const emojiScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  // Trigger animations on mount
  useEffect(() => {
    // Emoji scale-in with spring animation
    emojiScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Title fade in after 400ms
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));

    // Subtitle fade in after 700ms
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

    // Button fade in after 1000ms
    buttonOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
  }, []);

  // Animated styles
  const emojiAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
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
        {/* Empty header space (no back button) */}
        <View style={styles.header} />

        {/* Main content */}
        <View style={styles.mainContent}>
          {/* Celebration emoji with scale animation */}
          <Animated.View style={[styles.emojiContainer, emojiAnimatedStyle]}>
            <Text style={styles.emoji}>🎉</Text>
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            You're all set, {userName || 'friend'}!
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
            Your LockIn journey starts now.
          </Animated.Text>
        </View>

        {/* Continue button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
            buttonAnimatedStyle,
          ]}
        >
          <Button3D title="Let's Lock In" onPress={onContinue} />
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
    height: 72, // Same height as other screens for consistency
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60, // Offset to center content visually
  },
  emojiContainer: {
    marginBottom: 24,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: BrandColors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
