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
import LCCard from '../lc/LCCard';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';
import { animationReveal } from '../../../lib/haptics';

interface LifetimeUsageScreenProps {
  screenTime: number;
  onContinue: () => void;
  onBack: () => void;
}

function calcStats(screenTimeHours: number) {
  const hoursPerYear = screenTimeHours * 365;
  const daysPerYear = Math.round(hoursPerYear / 24);
  const totalYears = Math.round((hoursPerYear * 50) / (24 * 365));
  return { daysPerYear, totalYears };
}

export default function LifetimeUsageScreen({
  screenTime,
  onContinue,
  onBack,
}: LifetimeUsageScreenProps) {
  const { daysPerYear, totalYears } = calcStats(screenTime || 4);

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
    <LCFrame glow="center">
      <LCHeader onBack={onBack} />

      <Animated.View style={[styles.body, fadeStyle]}>
        <LCEyebrow text="The toll" />
        <LCDisplay
          lineOne={`${totalYears} years`}
          lineTwo="on a screen."
          accent="one"
          size={42}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          At your current pace, that's how much of your life you'll spend looking down.
        </LCBody>

        <View style={styles.heroWrap}>
          <Animated.View style={[styles.heroNumWrap, numStyle]}>
            <Text style={styles.heroNum}>{totalYears}</Text>
            <Text style={styles.heroUnit}>YRS</Text>
          </Animated.View>
        </View>

        <LCCard radius="md" padding={14} style={{ marginTop: 18 }}>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>PER YEAR</Text>
              <Text style={styles.rowValue}>{daysPerYear}D</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowItem}>
              <Text style={styles.rowLabel}>OVER 50 YRS</Text>
              <Text style={styles.rowValue}>{totalYears}Y</Text>
            </View>
          </View>
        </LCCard>
      </Animated.View>

      <LCCTA label="Continue" onPress={onContinue} />
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
    marginTop: 28,
    alignItems: 'center',
  },
  heroNumWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroNum: {
    fontFamily: Fonts.display,
    fontSize: 160,
    lineHeight: 170,
    color: LC.red,
    letterSpacing: -4,
    textShadowColor: LC.redGlow,
    textShadowRadius: 30,
    paddingTop: 10,
  },
  heroUnit: {
    fontFamily: Fonts.display,
    fontSize: 50,
    lineHeight: 56,
    color: LC.text,
    letterSpacing: 0,
    marginLeft: 6,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowItem: {
    flex: 1,
    alignItems: 'center',
  },
  rowLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.6,
    color: LC.textMute,
  },
  rowValue: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: LC.text,
    marginTop: 2,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: LC.border,
  },
});
