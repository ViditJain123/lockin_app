import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import LCBody from '../lc/LCBody';
import LCCard from '../lc/LCCard';
import LCChip from '../lc/LCChip';
import LCCTA from '../lc/LCCTA';
import LCDisplay from '../lc/LCDisplay';
import LCEyebrow from '../lc/LCEyebrow';
import LCFrame from '../lc/LCFrame';
import LCHeader from '../lc/LCHeader';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface SocialProofScreenProps {
  userName: string;
  selectedGoals: string[];
  onContinue: () => void;
  onBack: () => void;
}

const TESTIMONIALS = [
  { handle: 'tymofii', hours: '4.2H', quote: "down to 40 min on tiktok from 5 hrs. wild.", color: LC.red },
  { handle: 'colbee', hours: '3.1H', quote: "can't immediately scroll in the morning anymore.", color: LC.amber },
  { handle: 'marcus', hours: '23D', quote: 'finally got my screen time under control. accountability works.', color: LC.green },
];

export default function SocialProofScreen({ onContinue, onBack }: SocialProofScreenProps) {
  const fade = useSharedValue(0);
  const rise = useSharedValue(20);

  useEffect(() => {
    fade.value = withDelay(80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    rise.value = withDelay(80, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [fade, rise]);

  const reveal = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: rise.value }],
  }));

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <LCEyebrow text="You're not alone" />
          <LCDisplay
            lineOne="The club is"
            lineTwo="cooking."
            accent="two"
            size={46}
            style={{ marginTop: 10 }}
          />
        </View>

        <Animated.View style={[reveal, { paddingHorizontal: 24, marginTop: 22 }]}>
          <LCCard radius="xl" padding={18}>
            <Text style={styles.statLabel}>HOURS LOCKED · ALL-TIME</Text>
            <View style={styles.statRow}>
              <Text style={styles.statValue}>23.4</Text>
              <Text style={styles.statUnit}>M</Text>
            </View>
            <View style={styles.statGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statTileLabel}>MEMBERS</Text>
                <Text style={styles.statTileValue}>412K</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statTileLabel}>LIVE NOW</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={styles.statTileValue}>8,422</Text>
                  <View style={styles.livePulse} />
                </View>
              </View>
            </View>
          </LCCard>
        </Animated.View>

        <View style={[styles.body, { paddingTop: 22 }]}>
          <LCEyebrow text="In their words" tone="mute" />
          <View style={{ marginTop: 12, gap: 8 }}>
            {TESTIMONIALS.map((t) => (
              <LCCard key={t.handle} radius="md" padding={12}>
                <View style={styles.testimonialRow}>
                  <View style={[styles.avatar, { backgroundColor: t.color }]}>
                    <Text style={styles.avatarChar}>{t.handle[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.testimonialHead}>
                      <Text style={styles.handle}>@{t.handle}</Text>
                      <LCChip tone="red" size="sm">{`🔥 ${t.hours}`}</LCChip>
                    </View>
                    <LCBody size={13} style={{ marginTop: 2 }}>
                      “{t.quote}”
                    </LCBody>
                  </View>
                </View>
              </LCCard>
            ))}
          </View>
        </View>
      </ScrollView>

      <LCCTA label="Keep going" onPress={onContinue} hint="4.9 ★ · 82k reviews" />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  statLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
    color: LC.textMute,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: 70,
    lineHeight: 76,
    color: LC.text,
    letterSpacing: -1,
    paddingTop: 4,
  },
  statUnit: {
    fontFamily: Fonts.display,
    fontSize: 70,
    lineHeight: 76,
    color: LC.red,
    letterSpacing: -1,
    paddingTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statTile: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: LC.border,
  },
  statTileLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
    color: LC.textMute,
  },
  statTileValue: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: LC.text,
    marginTop: 2,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LC.red,
    shadowColor: LC.red,
    shadowOpacity: 1,
    shadowRadius: 6,
    alignSelf: 'center',
  },
  testimonialRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: '#fff',
  },
  testimonialHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    fontFamily: Fonts.interSemiBold,
    fontSize: 13,
    color: LC.text,
  },
});
