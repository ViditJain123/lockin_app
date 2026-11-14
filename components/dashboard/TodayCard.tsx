import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { buttonPress } from '@/lib/haptics';

// Roughly how many short videos a minute of scrolling burns through
// (~30s per reel including swipes). Used to make focus time feel concrete.
export const REELS_PER_MINUTE = 2;

export function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  if (rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

interface TodayCardProps {
  todayMinutes: number;
  targetHours: number;
  streak: number;
  onPress: () => void;
}

export default function TodayCard({ todayMinutes, targetHours, streak, onPress }: TodayCardProps) {
  const goalMinutes = targetHours * 60;
  const progress = goalMinutes > 0 ? todayMinutes / goalMinutes : 0;
  const done = progress >= 1;
  const remaining = Math.max(0, goalMinutes - todayMinutes);

  return (
    <Pressable
      onPress={() => {
        buttonPress();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Today ${formatHM(todayMinutes)} of ${targetHours} hour goal`}
    >
      {/* Ember glow from the top-right corner */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,102,0,0.5)', 'rgba(255,102,0,0.12)', 'rgba(255,102,0,0)']}
        locations={[0, 0.4, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>TODAY</Text>
        <View style={styles.streak}>
          <Ionicons name="flame" size={13} color={T.black} />
          <Text style={styles.streakText}>
            {streak} {streak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>
          {formatHM(todayMinutes)}
        </Text>
        <Text style={styles.pct}>{Math.min(100, Math.round(progress * 100))}%</Text>
      </View>
      <Text style={styles.goal}>
        {done ? (
          <Text style={{ color: T.yellow }}>Goal hit · {targetHours}h ✓</Text>
        ) : (
          <>
            of {targetHours}h goal · <Text style={styles.goalStrong}>{formatHM(remaining)} to go</Text>
          </>
        )}
      </Text>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.22)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: T.inkSoft,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: T.yellow,
  },
  streakText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: T.black,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 64,
    lineHeight: 68,
    color: T.ink,
    letterSpacing: 0.5,
  },
  pct: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 40,
    color: T.orange,
  },
  goal: {
    fontFamily: Fonts.medium,
    fontSize: 13.5,
    color: T.inkSoft,
    marginTop: 2,
  },
  goalStrong: {
    fontFamily: Fonts.bold,
    color: T.ink,
  },
});
