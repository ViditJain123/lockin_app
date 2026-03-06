import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BadgeDefinition } from '@/constants/Badges';
import { Fonts } from '@/constants/Fonts';

const BRAND_PINK = '#FF3B5C';

const CATEGORY_ICONS: Record<string, string> = {
  hours: '\u23F1',
  grinds: '\uD83D\uDCAA',
  streak: '\uD83D\uDD25',
};

const CATEGORY_LABELS: Record<string, string> = {
  hours: 'Hours',
  grinds: 'Grinds',
  streak: 'Streak',
};

export interface BadgeProgressItem {
  category: string;
  badge: BadgeDefinition;
  current: number;
  target: number;
  progress: number;
}

interface Props {
  items: BadgeProgressItem[];
}

export default function BadgeProgress({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next Milestones</Text>

      {items.map((item) => (
        <View key={item.category} style={styles.row}>
          <Text style={styles.icon}>{CATEGORY_ICONS[item.category]}</Text>
          <View style={styles.info}>
            <View style={styles.infoHeader}>
              <Text style={styles.badgeTitle}>{item.badge.title}</Text>
              <Text style={styles.progressText}>
                {Math.round(item.current)}/{item.target} {CATEGORY_LABELS[item.category]}
              </Text>
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round(item.progress * 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: 'white',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: 'white',
  },
  progressText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.45)',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,59,92,0.2)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: BRAND_PINK,
  },
});
