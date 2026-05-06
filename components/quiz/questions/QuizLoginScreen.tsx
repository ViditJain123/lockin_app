import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppleSignInButton from '../../AppleSignInButton';
import EmailAuthForm from '../../EmailAuthForm';
import LCBody from '../lc/LCBody';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { useAuth } from '../../../contexts/AuthContext';

interface QuizLoginScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function QuizLoginScreen({
  onContinue,
  onBack,
}: QuizLoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const hasCalledContinue = useRef(false);

  useEffect(() => {
    if (session && !hasCalledContinue.current) {
      hasCalledContinue.current = true;
      onContinue();
    }
  }, [session, onContinue]);

  return (
    <LCFrame glow="center">
      <LCHeader onBack={onBack} />

      <View style={styles.body}>
        <View style={styles.brandRow}>
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>LOCKIN CLUB</Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <LCEyebrow text="Join the club" />
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <LCDisplay
              lineOne="Sign in"
              accent="one"
              size={64}
              accentColor={LC.text}
            />
            <LCDisplay
              lineOne="to lock in."
              accent="one"
              size={64}
              accentColor={LC.red}
              style={{ textShadowColor: LC.redGlow, textShadowRadius: 28 }}
            />
          </View>
          <LCBody align="center" style={{ marginTop: 16, paddingHorizontal: 24 }}>
            Sign in to save your progress and sync across devices.
          </LCBody>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <AppleSignInButton />
        {Platform.OS === 'ios' ? (
          <View style={styles.orDividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.divider} />
          </View>
        ) : null}
        <EmailAuthForm />
        <Text style={styles.terms}>
          BY CONTINUING YOU AGREE TO OUR{' '}
          <Text style={styles.termsAccent}>TERMS</Text> · <Text style={styles.termsAccent}>PRIVACY</Text>
        </Text>
      </View>
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    alignItems: 'center',
  },
  brandRow: {
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,59,92,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,92,0.3)',
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LC.red,
  },
  brandText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: LC.red,
  },
  bottom: {
    paddingHorizontal: 20,
    gap: 14,
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orText: {
    color: LC.textMute,
    fontSize: 10,
    fontFamily: Fonts.monoMedium,
    letterSpacing: 2,
    paddingHorizontal: 12,
  },
  terms: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
  },
  termsAccent: {
    color: LC.text,
    fontFamily: Fonts.monoMedium,
  },
});
