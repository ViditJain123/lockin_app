import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 2,
  },
  pillSelected: {
    backgroundColor: '#FF6600',
  },
  pillText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
});
