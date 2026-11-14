import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { T, RADIUS, cardShadow } from '@/constants/Theme';
import { Fonts } from '@/constants/Fonts';
import {
  CRYSTALS,
  TIER_COLORS,
  TIER_LABELS,
  currentTierForLevel,
  nextCrystalLevel,
} from '@/constants/Crystals';
import { computeXP, xpProgressInLevel } from '@/lib/xp';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';

interface LockinXPCardProps {
  onPress?: () => void;
}

function formatXP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.floor(n / 1_000)}K`;
  return n.toLocaleString('en-US');
}

const RING_SIZE = 168;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

function LockinXPCard({ onPress }: LockinXPCardProps) {
  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const earnedCrystals = useCrystalStore((s) => s.earnedCrystals);

  const xp = useMemo(
    () => computeXP({ totalHours, totalGrinds: grinds }),
    [totalHours, grinds]
  );

  const { level, xpIntoLevel, xpForNextLevel, fraction } = useMemo(
    () => xpProgressInLevel(xp),
    [xp]
  );

  const currentTier = currentTierForLevel(level);
  const tierColor = currentTier ? TIER_COLORS[currentTier] : T.inkMute;
  const tierLabel = currentTier ? TIER_LABELS[currentTier] : 'UNRANKED';

  const nextCrystal = nextCrystalLevel(level);
  const levelsToNext = nextCrystal ? nextCrystal.milestoneLevel - level : 0;

  const totalCrystals = CRYSTALS.length;
  const earnedCount = earnedCrystals.length;

  const dashOffset = RING_CIRC * (1 - fraction);

  // The next trophy label — stays meaningful even when user has all trophies.
  const nextCrystalLabel = nextCrystal
    ? `Lv ${nextCrystal.milestoneLevel} (${levelsToNext})`
    : 'ALL CLAIMED';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Eyebrow row */}
      <View style={styles.eyebrowRow}>
        <Text style={styles.eyebrow}>◆ LOCKIN XP</Text>
        <Text style={[styles.tierLabel, { color: tierColor }]}>{tierLabel}</Text>
      </View>

      {/* Ring + level number */}
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={T.sunk}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={T.orange}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringInner}>
          <Text style={styles.lvLabel}>LV</Text>
          <Text style={styles.lvNumber}>{level}</Text>
          <Text style={styles.xpLine}>
            {formatXP(xpIntoLevel)}/{formatXP(xpForNextLevel)} XP
          </Text>
        </View>
      </View>

      {/* Mini stats row */}
      <View style={styles.miniRow}>
        <View style={styles.miniCell}>
          <Text style={styles.miniValue}>{formatXP(xp)}</Text>
          <Text style={styles.miniLabel}>TOTAL XP</Text>
        </View>
        <View style={styles.miniDivider} />
        <View style={styles.miniCell}>
          <Text style={styles.miniValue}>{nextCrystalLabel}</Text>
          <Text style={styles.miniLabel}>NEXT TROPHY</Text>
        </View>
        <View style={styles.miniDivider} />
        <View style={styles.miniCell}>
          <Text style={styles.miniValue}>
            {earnedCount}/{totalCrystals}
          </Text>
          <Text style={styles.miniLabel}>EARNED</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    ...cardShadow,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  pressed: {
    opacity: 0.92,
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: T.inkSoft,
    textTransform: 'uppercase',
  },
  tierLabel: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  ringWrap: {
    alignSelf: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ringInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lvLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: T.inkSoft,
  },
  lvNumber: {
    fontFamily: Fonts.display,
    fontSize: 64,
    lineHeight: 64,
    color: T.ink,
    letterSpacing: 1,
  },
  xpLine: {
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    color: T.inkSoft,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
  },
  miniCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  miniValue: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 22,
    color: T.ink,
    letterSpacing: 0.5,
  },
  miniLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 8,
    letterSpacing: 1.4,
    color: T.inkMute,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  miniDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: T.line,
  },
});

export default memo(LockinXPCard);
