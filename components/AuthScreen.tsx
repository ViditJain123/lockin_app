import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GoogleSignInButton from './GoogleSignInButton';

import { Fonts } from '../constants/Fonts';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient effect */}
      <View style={styles.gradientOverlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <BlurView intensity={20} style={styles.logoContainer}>
            <Text style={styles.logoText}>🔒</Text>
          </BlurView>
          <Text style={styles.appName}>LockIn</Text>
          <Text style={styles.tagline}>Focus. Create. Achieve.</Text>
        </View>

        {/* Sign In Section */}
        <View style={styles.signInSection}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Sign in to continue</Text>
            <View style={styles.divider} />
          </View>

          <GoogleSignInButton />

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    // Subtle gradient effect
    opacity: 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 87, 106, 0.15)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 42,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  signInSection: {
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontFamily: Fonts.regular,
    paddingHorizontal: 16,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
