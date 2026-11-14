import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MascotTrophy from '@/components/MascotTrophy';
import TrophyReveal from '@/components/TrophyReveal';
import {
  CRYSTALS_BY_LEVEL,
  type CrystalDefinition,
  TIER_LABELS,
} from '@/constants/Crystals';
import { Fonts } from '@/constants/Fonts';
import { cardShadow, T } from '@/constants/Theme';
import { computeXP, levelFromXP } from '@/lib/xp';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';

const COLS = 3;
const GAP = 12;

interface Origin {
  x: number;
  y: number;
  size: number;
}

function TrophyCell({
  crystal,
  earned,
  isNew,
  size,
  cellW,
  onOpen,
}: {
  crystal: CrystalDefinition;
  earned: boolean;
  isNew: boolean;
  size: number;
  cellW: number;
  onOpen: (c: CrystalDefinition, origin: Origin) => void;
}) {
  const ref = useRef<View>(null);
  return (
    <Pressable
      onPress={() => {
        ref.current?.measureInWindow((x, y, w) => onOpen(crystal, { x, y, size: w }));
      }}
      style={({ pressed }) => [styles.cell, { width: cellW }, pressed && styles.cellPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${crystal.name}, ${earned ? 'earned' : `locked, level ${crystal.milestoneLevel}`}`}
    >
      <View ref={ref} collapsable={false}>
        <MascotTrophy tier={crystal.tier} accessory={crystal.accessory} size={size} locked={!earned} />
        {isNew && <View style={styles.newDot} />}
      </View>
      <Text style={[styles.cellName, !earned && styles.cellNameLocked]} numberOfLines={2}>
        {crystal.name}
      </Text>
      <Text style={[styles.cellLevel, earned && { color: T.yellow }]}>Lv {crystal.milestoneLevel}</Text>
    </Pressable>
  );
}

export default function TrophiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const earnedList = useCrystalStore((s) => s.earnedCrystals);
  const pending = useCrystalStore((s) => s.pendingNewCrystals);
  const markSeen = useCrystalStore((s) => s.markCrystalAsSeen);
  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);
  const level = levelFromXP(computeXP({ totalHours, totalGrinds: grinds }));

  const earnedMap = useMemo(() => new Map(earnedList.map((e) => [e.crystalId, e.earnedAt])), [earnedList]);
  const earnedCount = earnedList.length;
  const total = CRYSTALS_BY_LEVEL.length;

  const cellW = Math.floor((width - 32 - GAP * (COLS - 1)) / COLS);
  const cellSize = cellW - 26;

  // ── Detail reveal ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<CrystalDefinition | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);

  const open = useCallback(
    (c: CrystalDefinition, o: Origin) => {
      setSelected(c);
      setOrigin(o);
      if (earnedMap.has(c.id) && pending.includes(c.id)) markSeen(c.id);
    },
    [earnedMap, pending, markSeen]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.cellPressed]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={T.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>TROPHY CASE</Text>
        <View style={styles.iconBtnGhost} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressBig}>
                {earnedCount}
                <Text style={styles.progressOf}> / {total}</Text>
              </Text>
              <Text style={styles.progressSub}>trophies collected</Text>
            </View>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>LV {level}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max((earnedCount / total) * 100, 2)}%` }]} />
          </View>
        </View>

        {(['common', 'uncommon', 'rare', 'epic', 'mythic'] as const).map((tier) => {
          const items = CRYSTALS_BY_LEVEL.filter((c) => c.tier === tier);
          const got = items.filter((c) => earnedMap.has(c.id)).length;
          return (
            <View key={tier} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{TIER_LABELS[tier]}</Text>
                <Text style={styles.sectionCount}>
                  {got}/{items.length}
                </Text>
              </View>
              <View style={styles.grid}>
                {items.map((c) => (
                  <TrophyCell
                    key={c.id}
                    crystal={c}
                    earned={earnedMap.has(c.id)}
                    isNew={pending.includes(c.id)}
                    size={cellSize}
                    cellW={cellW}
                    onOpen={open}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {selected && origin && (
        <TrophyReveal
          crystal={selected}
          earned={earnedMap.has(selected.id)}
          earnedAt={earnedMap.get(selected.id)}
          level={level}
          origin={origin}
          onClose={() => {
            setSelected(null);
            setOrigin(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  iconBtnGhost: {
    width: 42,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    letterSpacing: 1.5,
    color: T.ink,
  },
  progressCard: {
    marginTop: 4,
    padding: 18,
    borderRadius: 24,
    backgroundColor: T.card,
    ...cardShadow,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBig: {
    fontFamily: Fonts.display,
    fontSize: 48,
    lineHeight: 52,
    color: T.ink,
  },
  progressOf: {
    fontSize: 26,
    color: T.inkMute,
  },
  progressSub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: T.inkSoft,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: T.yellow,
  },
  levelPillText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: T.black,
    letterSpacing: 1,
  },
  track: {
    marginTop: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.sunk,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: T.yellow,
  },
  section: {
    marginTop: 26,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    letterSpacing: 1.5,
    color: T.ink,
  },
  sectionCount: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    color: T.inkMute,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: T.card,
    ...cardShadow,
  },
  cellPressed: {
    transform: [{ scale: 0.95 }],
  },
  newDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.orange,
    borderWidth: 2,
    borderColor: T.card,
  },
  cellName: {
    marginTop: 8,
    fontFamily: Fonts.bold,
    fontSize: 13,
    textAlign: 'center',
    color: T.ink,
    paddingHorizontal: 6,
  },
  cellNameLocked: {
    color: T.inkMute,
  },
  cellLevel: {
    marginTop: 2,
    fontFamily: Fonts.monoMedium,
    fontSize: 10.5,
    color: T.inkMute,
  },
  flood: {
    position: 'absolute',
  },
  detailText: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  kicker: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 13,
    letterSpacing: 3,
    opacity: 0.8,
  },
  bigName: {
    marginTop: 2,
    fontFamily: Fonts.display,
    fontSize: 76,
    lineHeight: 78,
    textAlign: 'center',
    letterSpacing: 1,
  },
  lore: {
    marginTop: 8,
    fontFamily: Fonts.semiBold,
    fontSize: 17,
    textAlign: 'center',
    opacity: 0.85,
  },
  meta: {
    marginTop: 10,
    fontFamily: Fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.6,
    textAlign: 'center',
  },
  watermark: {
    marginTop: 18,
    fontFamily: Fonts.dmSansBold,
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.45,
  },
  closeWrap: {
    position: 'absolute',
    right: 16,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  shareBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: T.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnLight: {
    backgroundColor: T.yellow,
  },
  shareText: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: 2,
    color: T.yellow,
  },
  shareTextDark: {
    color: T.black,
  },
  lockedPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lockedText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: T.inkSoft,
  },
});
