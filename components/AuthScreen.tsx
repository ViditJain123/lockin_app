import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppleSignInButton from './AppleSignInButton';
import EmailAuthForm from './EmailAuthForm';
import Mascot from '@/components/Mascot';

import { Fonts } from '../constants/Fonts';
import { RADIUS, T, cardShadow } from '../constants/Theme';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Soft orange glow behind the mascot */}
      <View pointerEvents="none" style={styles.glow} />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Brand */}
        <View style={styles.brandSection}>
          <View style={styles.mascotTile}>
            <Mascot size={96} />
          </View>
          <Text style={styles.wordmark}>
            LOCKIN <Text style={styles.wordmarkAccent}>CLUB</Text>
          </Text>
          <Text style={styles.tagline}>Focus. Create. Achieve.</Text>
        </View>

        {/* Sign in. AppleSignInButton and EmailAuthForm are styled for a dark
            surface (white button, white input text), so they sit on an ink panel. */}
        <View style={[styles.signInSection, { paddingBottom: insets.bottom + 28 }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: T.orangeSoft,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mascotTile: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.xl,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    ...cardShadow,
  },
  wordmark: {
    fontFamily: Fonts.dmSansBold,
    fontSize: 34,
    letterSpacing: 1,
    color: T.ink,
  },
  wordmarkAccent: {
    color: T.orange,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: T.inkSoft,
    letterSpacing: 0.3,
  },
  signInSection: {
    alignItems: 'center',
    gap: 20,
    paddingTop: 28,
    paddingHorizontal: 28,
    backgroundColor: T.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
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
  // Text below sits on the ink panel, so it uses translucent white.
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
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: Fonts.medium,
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
