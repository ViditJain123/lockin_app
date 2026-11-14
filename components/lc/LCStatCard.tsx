// Lockin Club — stat card
// Small card with mono label, Bebas Neue value, and optional mono unit.
// Appears in Home, Analytics KPI strip, and Profile counters.

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T, cardShadow } from '@/constants/Theme';

type LCStatCardProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hot?: boolean; // red value (e.g. streak days)
  style?: StyleProp<ViewStyle>;
};

export function LCStatCard({ label, value, unit, hot, style }: LCStatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, hot && styles.valueHot]}>{value}</Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.card,
    ...cardShadow,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 28,
    color: T.ink,
    marginTop: 4,
  },
  valueHot: {
    color: T.orange,
  },
  unit: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: T.inkSoft,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

export default LCStatCard;
