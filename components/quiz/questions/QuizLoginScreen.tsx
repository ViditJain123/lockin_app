import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
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

import GoogleSignInButton from '../../GoogleSignInButton';
import CloudBackground from '../CloudBackground';

import { BrandColors } from '../../../constants/BrandColors';
import { Fonts } from '../../../constants/Fonts';
import { useAuth } from '../../../contexts/AuthContext';

// Assets
const nightSkyBackground = require('../../../assets/images/night-sky-background.jpeg');
const logo = require('../../../assets/images/logo-no-bg.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuizLoginScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

/**
 * QuizLoginScreen - Login screen shown during quiz funnel, before payment
 */
export default function QuizLoginScreen({
  onContinue,
  onBack,
}: QuizLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const hasCalledContinue = useRef(false);

  // Auto-proceed when user successfully authenticates
  useEffect(() => {
    if (session && !hasCalledContinue.current) {
      hasCalledContinue.current = true;
      onContinue();
    }
  }, [session, onContinue]);

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
          {/* Logo */}
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          {/* Tagline */}
          <Text style={styles.tagline}>Focus. Create. Achieve.</Text>
        </View>

        {/* Sign In Section */}
        <View style={[styles.signInSection, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Sign in to continue</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.buttonContainer}>
            <GoogleSignInButton />
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.52,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    fontFamily: Fonts.interSemiBold,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  signInSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
