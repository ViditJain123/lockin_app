// Lockin Club — stat card
// Small card with mono label, Bebas Neue value, and optional mono unit.
// Appears in Home, Analytics KPI strip, and Profile counters.

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

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
    borderRadius: 14,
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 28,
    color: LC.text,
    marginTop: 4,
  },
  valueHot: {
    color: LC.red,
  },
  unit: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.textDim,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

export default LCStatCard;
