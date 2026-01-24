import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BadgeCategory } from '@/constants/Badges';
import { Fonts } from '@/constants/Fonts';

interface CategoryTabsProps {
  selected: BadgeCategory;
  onSelect: (category: BadgeCategory) => void;
}

const TABS: { key: BadgeCategory; label: string }[] = [
  { key: 'hours', label: 'Hours' },
  { key: 'grinds', label: 'Grinds' },
  { key: 'streak', label: 'Streak' },
];

export default function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
  },
  tabText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    fontFamily: Fonts.semiBold,
    color: '#FF3B5C',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 24,
    height: 3,
    backgroundColor: '#FF3B5C',
    borderRadius: 2,
  },
});
