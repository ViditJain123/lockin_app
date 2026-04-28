// Lockin Club — chip / tag pill
// Small mono-caps pill used for status tags and filters.
// Source: design-reference/lockin-club/project/tokens.jsx (LCChip)

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

type LCChipTone = 'default' | 'red' | 'green' | 'mute';

type LCChipProps = {
  children: React.ReactNode;
  tone?: LCChipTone;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<LCChipTone, { bg: string; color: string; border: string }> = {
  default: {
    bg: 'rgba(255,255,255,0.08)',
    color: LC.text,
    border: 'rgba(255,255,255,0.08)',
  },
  red: {
    bg: 'rgba(255,59,48,0.14)',
    color: LC.red,
    border: 'rgba(255,59,48,0.3)',
  },
  green: {
    bg: 'rgba(74,222,128,0.12)',
    color: LC.green,
    border: 'rgba(74,222,128,0.3)',
  },
  mute: {
    bg: 'transparent',
    color: LC.textDim,
    border: 'rgba(255,255,255,0.12)',
  },
};

export function LCChip({ children, tone = 'default', style }: LCChipProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: t.bg, borderColor: t.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: t.color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default LCChip;
