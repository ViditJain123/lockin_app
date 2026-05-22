import * as StoreReview from 'expo-store-review';
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

interface RatingScreenProps {
  userName: string;
  onContinue: () => void;
  onBack: () => void;
}

const REVIEWS = [
  { handle: 'devon', hours: '6.1H', quote: 'this app dragged me out of a doomscroll spiral. worth every star.', color: LC.red },
  { handle: 'priya', hours: '17D', quote: 'the accountability is unreal. down to 1hr a day and climbing.', color: LC.green },
];

export default function RatingScreen({ userName, onContinue, onBack }: RatingScreenProps) {
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

  const handleRate = async () => {
    try {
      if (await StoreReview.isAvailableAsync()) {
        await StoreReview.requestReview();
      }
    } catch {
      // requestReview is best-effort; never block the funnel on it.
    }
    onContinue();
  };

  return (
    <LCFrame glow="top">
      <LCHeader onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <LCEyebrow text="One last thing" />
          <LCDisplay
            lineOne="Help the"
            lineTwo="club grow."
            accent="two"
            size={46}
            style={{ marginTop: 10 }}
          />
          <LCBody style={{ marginTop: 8 }}>
            {userName ? `${userName}, you're` : "You're"} joining{' '}
            <Text style={{ color: LC.text, fontFamily: Fonts.interSemiBold }}>412k members</Text>{' '}
            locked in. A quick rating helps the next person break the scroll.
          </LCBody>
        </View>

        <Animated.View style={[reveal, { paddingHorizontal: 24, marginTop: 22 }]}>
          <LCCard radius="xl" padding={20}>
            <View style={styles.starRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Text key={i} style={styles.star}>
                  ★
                </Text>
              ))}
            </View>
            <Text style={styles.ratingValue}>4.9</Text>
            <Text style={styles.ratingLabel}>82,418 RATINGS · APP STORE</Text>
          </LCCard>
        </Animated.View>

        <View style={[styles.body, { paddingTop: 22 }]}>
          <LCEyebrow text="In their words" tone="mute" />
          <View style={{ marginTop: 12, gap: 8 }}>
            {REVIEWS.map((r) => (
              <LCCard key={r.handle} radius="md" padding={12}>
                <View style={styles.reviewRow}>
                  <View style={[styles.avatar, { backgroundColor: r.color }]}>
                    <Text style={styles.avatarChar}>{r.handle[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewHead}>
                      <Text style={styles.handle}>@{r.handle}</Text>
                      <LCChip tone="red" size="sm">{`🔥 ${r.hours}`}</LCChip>
                    </View>
                    <LCBody size={13} style={{ marginTop: 2 }}>
                      “{r.quote}”
                    </LCBody>
                  </View>
                </View>
              </LCCard>
            ))}
          </View>
        </View>
      </ScrollView>

      <LCCTA label="Rate Lockin Club" onPress={handleRate} hint="4.9 ★ · 82k reviews" />
    </LCFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  star: {
    fontSize: 28,
    color: LC.amber,
  },
  ratingValue: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: LC.text,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 8,
  },
  ratingLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: LC.textMute,
    textAlign: 'center',
    marginTop: 2,
  },
  reviewRow: {
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
  reviewHead: {
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
