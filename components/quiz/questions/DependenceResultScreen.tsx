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

const AVERAGE_PERCENTAGE = 33;
const BAR_MAX_HEIGHT = 180;
const REVEAL_DELAY = 400;
const REVEAL_DURATION = 1100;

interface DependenceResultScreenProps {
  screenTime: number;
  desiredScreenTime: number;
  problematicApps: string[];
  onContinue: () => void;
  onBack: () => void;
}

function calculateDependenceScore(
  screenTime: number,
  desiredScreenTime: number,
  problematicApps: string[]
): number {
  let score = 50;
  score += Math.min((screenTime / 12) * 15, 15);
  score += Math.min(Math.max((screenTime - desiredScreenTime) * 2, 0), 10);
  score += Math.min(problematicApps.length * 2, 10);
  return Math.min(Math.max(Math.round(score), 50), 85);
}

export default function DependenceResultScreen({
  screenTime,
  desiredScreenTime,
  problematicApps,
  onContinue,
  onBack,
}: DependenceResultScreenProps) {
  const userScore = calculateDependenceScore(screenTime, desiredScreenTime, problematicApps);
  const diff = userScore - AVERAGE_PERCENTAGE;

  const userBar = useSharedValue(0);
  const avgBar = useSharedValue(0);
  const reveal = useSharedValue(0);

  useEffect(() => {
    reveal.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    userBar.value = withDelay(
      REVEAL_DELAY,
      withTiming((userScore / 100) * BAR_MAX_HEIGHT, {
        duration: REVEAL_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );
    avgBar.value = withDelay(
      REVEAL_DELAY,
      withTiming((AVERAGE_PERCENTAGE / 100) * BAR_MAX_HEIGHT, {
        duration: REVEAL_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    );
    const t = setTimeout(animationReveal, REVEAL_DELAY + REVEAL_DURATION);
    return () => clearTimeout(t);
  }, [userScore, userBar, avgBar, reveal]);

  const userBarStyle = useAnimatedStyle(() => ({ height: userBar.value }));
  const avgBarStyle = useAnimatedStyle(() => ({ height: avgBar.value }));
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.value }));

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <Animated.View style={[styles.body, revealStyle]}>
        <LCEyebrow text="The verdict · be honest" />
        <LCDisplay
          lineOne="You're"
          lineTwo="hooked."
          accent="two"
          size={48}
          style={{ marginTop: 10 }}
        />
        <LCBody style={{ marginTop: 8 }}>
          Your answers point to a clear{' '}
          <Text style={{ color: LC.red, fontFamily: Fonts.interSemiBold }}>
            negative dependence
          </Text>
          {' '}on your phone.
        </LCBody>

        <LCCard radius="xl" padding={18} style={{ marginTop: 22 }}>
          <View style={styles.barsRow}>
            <View style={styles.barCol}>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFillRed, userBarStyle]}>
                  <Text style={styles.barNum}>{userScore}%</Text>
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>YOU</Text>
            </View>
            <View style={styles.barCol}>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFillMute, avgBarStyle]}>
                  <Text style={styles.barNumMuted}>{AVERAGE_PERCENTAGE}%</Text>
                </Animated.View>
              </View>
              <Text style={styles.barLabel}>AVG</Text>
            </View>
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryHead}>TOTAL DAMAGE</Text>
            <Text style={styles.summaryNum}>{`+${diff}%`}</Text>
            <Text style={styles.summarySub}>WORSE THAN THE AVERAGE GRINDER</Text>
          </View>
        </LCCard>

        <Text style={styles.disclaimer}>* NOT A PSYCHOLOGICAL DIAGNOSIS</Text>
      </Animated.View>

      <LCCTA label="OK I'm in trouble" onPress={onContinue} />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'center',
  },
  barCol: {
    alignItems: 'center',
  },
  barTrack: {
    width: 70,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFillRed: {
    backgroundColor: LC.red,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    shadowColor: LC.red,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  barFillMute: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  barNum: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: '#fff',
  },
  barNumMuted: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: LC.text,
  },
  barLabel: {
    marginTop: 8,
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: LC.textMute,
  },
  summary: {
    marginTop: 18,
    alignItems: 'center',
  },
  summaryHead: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: LC.textMute,
  },
  summaryNum: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: LC.red,
    letterSpacing: -1,
    textShadowColor: LC.redGlow,
    textShadowRadius: 16,
    marginTop: 2,
  },
  summarySub: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    color: LC.textDim,
    marginTop: 2,
  },
  disclaimer: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    letterSpacing: 1.4,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 14,
  },
});
