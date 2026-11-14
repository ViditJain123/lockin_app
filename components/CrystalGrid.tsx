import React, { memo, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import CrystalImage from './CrystalImage';

import { T, RADIUS, cardShadow } from '@/constants/Theme';
import { Fonts } from '@/constants/Fonts';
import {
  CRYSTALS_BY_LEVEL,
  CrystalDefinition,
  TIER_COLORS,
  TIER_LABELS,
} from '@/constants/Crystals';
import { getContentWidth } from '@/lib/responsive';
import { computeXP, xpProgressInLevel } from '@/lib/xp';
import { useCrystalStore } from '@/store/useCrystalStore';
import { useProfileStatsStore } from '@/store/useProfileStatsStore';

const COLUMNS = 3;
const GAP = 8;
const H_PADDING = 16;
const ITEM_SIZE = (getContentWidth() - H_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

interface CrystalGridProps {
  onPressCrystal?: (crystal: CrystalDefinition) => void;
}

function CrystalGrid({ onPressCrystal }: CrystalGridProps) {
  const earnedCrystals = useCrystalStore((s) => s.earnedCrystals);
  const earnedIds = useMemo(
    () => new Set(earnedCrystals.map((ec) => ec.crystalId)),
    [earnedCrystals]
  );

  const totalHours = useProfileStatsStore((s) => s.total_hours);
  const grinds = useProfileStatsStore((s) => s.grinds);

  const [selected, setSelected] = useState<CrystalDefinition | null>(null);

  const xp = useMemo(
    () => computeXP({ totalHours, totalGrinds: grinds }),
    [totalHours, grinds]
  );
  const { level, fraction } = useMemo(() => xpProgressInLevel(xp), [xp]);

  const handlePress = (crystal: CrystalDefinition) => {
    setSelected(crystal);
    onPressCrystal?.(crystal);
  };

  return (
    <View style={styles.wrap}>
      {/* Compact XP summary strip */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryLevel}>LV {level}</Text>
        <View style={styles.summaryBarOuter}>
          <View
            style={[
              styles.summaryBarFill,
              { width: `${Math.max(2, fraction * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.summaryCount}>
          {earnedCrystals.length}/{CRYSTALS_BY_LEVEL.length}
        </Text>
      </View>

      <View style={styles.grid}>
        {CRYSTALS_BY_LEVEL.map((crystal) => {
          const earned = earnedIds.has(crystal.id);
          return (
            <Pressable
              key={crystal.id}
              onPress={() => handlePress(crystal)}
              style={({ pressed }) => [
                styles.cell,
                {
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                },
                pressed && styles.cellPressed,
              ]}
            >
              <CrystalImage
                crystalId={crystal.id}
                size={ITEM_SIZE * 0.62}
                locked={!earned}
              />
              <Text
                style={[
                  styles.cellLabel,
                  { color: earned ? T.ink : T.inkMute },
                ]}
                numberOfLines={1}
              >
                {earned ? crystal.name : `Lv ${crystal.milestoneLevel}`}
              </Text>
              <Text
                style={[
                  styles.cellTier,
                  { color: earned ? TIER_COLORS[crystal.tier] : T.inkMute },
                ]}
                numberOfLines={1}
              >
                {TIER_LABELS[crystal.tier]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CrystalDetailModal
        crystal={selected}
        earned={selected ? earnedIds.has(selected.id) : false}
        earnedAt={
          selected
            ? earnedCrystals.find((ec) => ec.crystalId === selected.id)?.earnedAt
            : undefined
        }
        currentLevel={level}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

interface DetailProps {
  crystal: CrystalDefinition | null;
  earned: boolean;
  earnedAt?: number;
  currentLevel: number;
  onClose: () => void;
}

function CrystalDetailModal({ crystal, earned, earnedAt, currentLevel, onClose }: DetailProps) {
  if (!crystal) return null;

  const tierColor = TIER_COLORS[crystal.tier];
  const tierLabel = TIER_LABELS[crystal.tier];

  const earnedDateStr = earnedAt
    ? new Date(earnedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const levelsAway = Math.max(0, crystal.milestoneLevel - currentLevel);

  return (
    <Modal visible={!!crystal} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={[styles.modalTier, { color: tierColor }]}>◆ {tierLabel}</Text>
          <View style={styles.modalImage}>
            <CrystalImage crystalId={crystal.id} size={140} locked={!earned} />
          </View>
          <Text style={styles.modalName}>{crystal.name}</Text>
          <Text style={styles.modalLore}>{crystal.lore}</Text>
          <View style={styles.modalDivider} />
          {earned ? (
            <Text style={styles.modalMeta}>
              EARNED · LV {crystal.milestoneLevel}
              {earnedDateStr ? ` · ${earnedDateStr.toUpperCase()}` : ''}
            </Text>
          ) : (
            <Text style={styles.modalMeta}>
              EARN AT LV {crystal.milestoneLevel}
              {levelsAway > 0 ? ` · ${levelsAway} TO GO` : ''}
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: H_PADDING - 4,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  summaryLevel: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: T.ink,
    letterSpacing: 0.5,
  },
  summaryBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: T.sunk,
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: T.orange,
  },
  summaryCount: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: T.inkSoft,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    backgroundColor: T.card,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 2,
    ...cardShadow,
  },
  cellPressed: {
    opacity: 0.7,
  },
  cellLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    marginTop: 2,
  },
  cellTier: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: T.card,
    borderRadius: RADIUS.lg,
    padding: 24,
    ...cardShadow,
    alignItems: 'center',
  },
  modalTier: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  modalImage: {
    marginVertical: 8,
  },
  modalName: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    color: T.ink,
    marginBottom: 6,
  },
  modalLore: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: T.inkSoft,
    textAlign: 'center',
  },
  modalDivider: {
    width: '60%',
    height: 1,
    backgroundColor: T.line,
    marginVertical: 16,
  },
  modalMeta: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.inkMute,
  },
});

export default memo(CrystalGrid);
