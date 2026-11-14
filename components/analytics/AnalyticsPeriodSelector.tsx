import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T, cardShadow } from '@/constants/Theme';
import { AnalyticsTab } from '@/types/analytics';

const TABS: { key: AnalyticsTab; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

interface Props {
  selected: AnalyticsTab;
  onSelect: (tab: AnalyticsTab) => void;
}

export default function AnalyticsPeriodSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isSelected = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(tab.key)}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: T.sunk,
    borderRadius: 999,
    padding: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 2,
  },
  pillSelected: {
    backgroundColor: T.card,
    ...cardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  pillText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: T.inkMute,
  },
  pillTextSelected: {
    color: T.ink,
    fontFamily: Fonts.bold,
  },
});
