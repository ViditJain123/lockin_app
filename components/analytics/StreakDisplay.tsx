import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';

interface Props {
  streak: number;
  variant?: 'compact' | 'full';
}

export default function StreakDisplay({ streak, variant = 'compact' }: Props) {
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={styles.compactCount}>{streak}</Text>
        <Text style={styles.compactLabel}>day streak</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <Text style={styles.fireLarge}>🔥</Text>
      <Text style={styles.fullCount}>{streak}</Text>
      <Text style={styles.fullLabel}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fireEmoji: {
    fontSize: 20,
  },
  compactCount: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: '#FF9500',
    marginLeft: 8,
  },
  compactLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 6,
  },
  fullContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  fireLarge: {
    fontSize: 36,
  },
  fullCount: {
    fontSize: 36,
    fontFamily: Fonts.bold,
    color: '#FF9500',
    marginTop: 4,
  },
  fullLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
