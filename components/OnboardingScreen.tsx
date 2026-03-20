import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button3D from './Button3D';
import GifCarousel from './GifCarousel';

import { Fonts } from '../constants/Fonts';

// Assets
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');
const logo = require('../assets/images/logo-no-bg.png');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={nightSkyBackground}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better readability */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Logo at top - no padding below as logo has built-in spacing */}
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        {/* GIF Carousel - directly below logo with no padding */}
        <GifCarousel />

        {/* Spacer above text - centers text vertically */}
        <View style={styles.spacer} />

        {/* Tagline text */}
        <View style={styles.textContainer}>
          <Text style={styles.taglineTop}>IT'S TIME TO</Text>
          <Text style={styles.taglineBottom}>LOCK THE F'CK IN</Text>
        </View>

        {/* Spacer below text - centers text vertically */}
        <View style={styles.spacer} />

        {/* Get Started Button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 40 }]}>
          <Button3D
            title="Get Started"
            onPress={onComplete}
            icon={<Text style={styles.buttonArrow}>→</Text>}
            iconPosition="right"
          />
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
    alignItems: 'center',
  },
  logoContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    // No bottom margin/padding - GIFs should be directly below
  },
  logo: {
    width: SCREEN_WIDTH*0.75,
    height: SCREEN_WIDTH*0.6,
  },
  spacer: {
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  taglineTop: {
    fontSize: 32,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  taglineBottom: {
    fontSize: 32,
    fontFamily: Fonts.interExtraBold,
    color: '#FF3B5C',
    textAlign: 'center',
    letterSpacing: 1,
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
