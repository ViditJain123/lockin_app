import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IPhoneVideoFrame from './IPhoneVideoFrame';
import LCCTA from './quiz/lc/LCCTA';
import LCFrame from './quiz/lc/LCFrame';

import { Fonts } from '../constants/Fonts';
import { LC } from '../constants/LockinClubColors';

const onboardingVideo = require('../assets/images/onboarding/onboarding.mov');

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHONE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.56);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  // CTA = button (~54) + paddingBottom (14 + safeBottom)
  const ctaReserve = 80 + insets.bottom;

  return (
    <LCFrame glow="center" glowIntensity="normal">
      <View style={[styles.content, { paddingBottom: ctaReserve }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandPill}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>LOCKIN CLUB</Text>
          </View>
        </View>

        <View style={styles.phoneWrap}>
          <IPhoneVideoFrame source={onboardingVideo} height={PHONE_HEIGHT} />
        </View>

        <Text style={styles.headline}>
          LOCK <Text style={styles.headlineAccent}>IN</Text> OR LOSE.
        </Text>
      </View>

      <LCCTA label="I'm locking in" onPress={onComplete} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
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
    shadowColor: LC.red,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  brandText: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: LC.red,
  },
  phoneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: 44,
    lineHeight: 50,
    paddingTop: 4,
    letterSpacing: 1,
    color: LC.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  headlineAccent: {
    color: LC.red,
    textShadowColor: LC.redGlow,
    textShadowRadius: 22,
  },
});
