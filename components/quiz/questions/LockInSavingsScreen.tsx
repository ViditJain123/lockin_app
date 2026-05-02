import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import LCBody from '../lc/LCBody';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { animationReveal } from '../../../lib/haptics';

interface LockInSavingsScreenProps {
  screenTime: number;
  desiredScreenTime: number;
  onContinue: () => void;
  onBack: () => void;
}

function calculateSavings(screenTimeHours: number, desiredScreenTimeHours: number) {
  const savedHoursPerDay = Math.max(screenTimeHours - desiredScreenTimeHours, 0);
  const savedHoursPerYear = savedHoursPerDay * 365;
  const totalSavedYears = Math.round((savedHoursPerYear * 50) / (24 * 365));
  return Math.max(totalSavedYears, 3);
}

export default function LockInSavingsScreen({
  screenTime,
  desiredScreenTime,
  onContinue,
  onBack,
}: LockInSavingsScreenProps) {
  const savedYears = calculateSavings(screenTime || 4, desiredScreenTime || 2);

  const fade = useSharedValue(0);
  const numScale = useSharedValue(0.6);
  const numOpacity = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    numOpacity.value = withDelay(420, withTiming(1, { duration: 280 }));
    numScale.value = withDelay(420, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    const t = setTimeout(animationReveal, 940);
    return () => clearTimeout(t);
  }, [fade, numScale, numOpacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const numStyle = useAnimatedStyle(() => ({
    opacity: numOpacity.value,
    transform: [{ scale: numScale.value }],
  }));

  return (
    <LCFrame glow="center" glowColor={LC.greenGlow}>
      <LCHeader onBack={onBack} />

      <Animated.View style={[styles.body, fadeStyle]}>
        <LCEyebrow text="The flip" tone="green" />
        <LCDisplay
          lineOne="Reclaim"
          lineTwo={`${savedYears} years.`}
          accent="two"
          accentColor={LC.green}
          size={44}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          With Lockin in your corner — that's how much of your life you get back.
        </LCBody>

        <View style={styles.heroWrap}>
          <Animated.View style={[styles.heroNumWrap, numStyle]}>
            <Text style={styles.heroNumPrefix}>+</Text>
            <Text style={styles.heroNum}>{savedYears}</Text>
            <Text style={styles.heroUnit}>YRS</Text>
          </Animated.View>
        </View>

        <Text style={styles.disclaimer}>
          BASED ON YOUR PROFILE × THE LOCKIN PROGRAM
        </Text>
      </Animated.View>

      <LCCTA label="Continue" onPress={onContinue} tone="green" />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  heroWrap: {
    marginTop: 30,
    alignItems: 'center',
  },
  heroNumWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroNumPrefix: {
    fontFamily: Fonts.display,
    fontSize: 80,
    lineHeight: 90,
    color: LC.green,
    marginRight: 4,
    paddingTop: 6,
  },
  heroNum: {
    fontFamily: Fonts.display,
    fontSize: 160,
    lineHeight: 170,
    color: LC.green,
    letterSpacing: -4,
    textShadowColor: LC.greenGlow,
    textShadowRadius: 30,
    paddingTop: 10,
  },
  heroUnit: {
    fontFamily: Fonts.display,
    fontSize: 50,
    lineHeight: 56,
    color: LC.text,
    marginLeft: 6,
    paddingTop: 4,
  },
  disclaimer: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 24,
  },
});
