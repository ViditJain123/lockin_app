import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';

// Map goal IDs to display info
const GOAL_DISPLAY_MAP: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  screen_time: { label: 'Reduce Screen Time', icon: 'phone-portrait-outline' },
  late_night: { label: 'Better Sleep', icon: 'moon-outline' },
  consistency: { label: 'Build Self-Control', icon: 'fitness-outline' },
  study: { label: 'Better Focus', icon: 'book-outline' },
  work: { label: 'More Productive', icon: 'briefcase-outline' },
  present: { label: 'Be Present', icon: 'leaf-outline' },
  social: { label: 'Less Isolation', icon: 'people-outline' },
};

interface GoalTagProps {
  goalId: string;
}

/**
 * GoalTag - Pill-shaped tag displaying a goal with icon
 * Used in the SocialProofScreen to show user's selected goals
 */
export default function GoalTag({ goalId }: GoalTagProps) {
  const goalInfo = GOAL_DISPLAY_MAP[goalId];

  if (!goalInfo) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={goalInfo.icon}
        size={16}
        color={BrandColors.primary.main}
      />
      <Text style={styles.label}>{goalInfo.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 92, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: BrandColors.text.primary,
  },
});
