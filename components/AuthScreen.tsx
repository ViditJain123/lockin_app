import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppleSignInButton from './AppleSignInButton';
import EmailAuthForm from './EmailAuthForm';

import { Fonts } from '../constants/Fonts';

// Assets
const nightSkyBackground = require('../assets/images/night-sky-background.jpeg');
const logo = require('../assets/images/logo-no-bg.png');

const SCREEN_WIDTH = Math.min(Dimensions.get('window').width, 430);

export default function AuthScreen() {
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
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
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
            <AppleSignInButton />
            {Platform.OS === 'ios' ? (
              <View style={styles.orDividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.divider} />
              </View>
            ) : null}
            <EmailAuthForm />
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  signInSection: {
    alignItems: 'center',
    gap: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontFamily: Fonts.regular,
    paddingHorizontal: 12,
    letterSpacing: 1.5,
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
  termsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
