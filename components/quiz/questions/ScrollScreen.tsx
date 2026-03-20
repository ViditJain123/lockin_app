import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from '../../Button3D';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const scrollGif = require('../../../assets/images/scroll.gif');

const { width: RAW_SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(RAW_SCREEN_WIDTH, 430);

// Timer constants
const MINUTE_CYCLE_DURATION = 12720; // 2 seconds to cycle through all numbers
const MINUTES = [-1, -2, -3, -4];

interface ScrollScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * ScrollScreen - Shows the scroll feature with cycling -1, -2, -3 minutes
 * Displays the scroll.gif at the top with a minute counter below
 */
export default function ScrollScreen({
  onContinue,
  onBack,
}: ScrollScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentMinuteIndex, setCurrentMinuteIndex] = useState(0);

  // Cycle through -1, -2, -3 minutes
  useEffect(() => {
    const intervalDuration = MINUTE_CYCLE_DURATION / MINUTES.length;
    const interval = setInterval(() => {
      setCurrentMinuteIndex((prev) => (prev + 1) % MINUTES.length);
    }, intervalDuration);

    return () => clearInterval(interval);
  }, []);

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
        <View style={styles.mainContent}>
          {/* GIF at the top */}
          <View style={styles.gifContainer}>
            <Image
              source={scrollGif}
              style={styles.gif}
              resizeMode="contain"
            />
          </View>

          {/* Minute counter */}
          <View style={styles.minuteContainer}>
            <Text style={styles.minuteText}>{MINUTES[currentMinuteIndex]} min</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Scroll</Text>

          {/* Description */}
          <Text style={styles.description}>
            You can use your saved up Screen Time{'\n'}any time.
          </Text>
        </View>

        {/* Continue button */}
        <View
          style={[
            styles.buttonContainer,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Button3D title="Continue" onPress={onContinue} />
        </View>
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
  gifContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_HEIGHT * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  gif: {
    width: '130%',
    height: '130%',
  },
  minuteContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  minuteText: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: BrandColors.primary.main,
    paddingLeft: 150,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    color: BrandColors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
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
