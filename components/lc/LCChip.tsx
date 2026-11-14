// Lockin Club — chip / tag pill
// Small mono-caps pill used for status tags and filters.
// Source: design-reference/lockin-club/project/tokens.jsx (LCChip)

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { T } from '@/constants/Theme';

type LCChipTone = 'default' | 'red' | 'green' | 'mute';

type LCChipProps = {
  children: React.ReactNode;
  tone?: LCChipTone;
  style?: StyleProp<ViewStyle>;
};

const TONES: Record<LCChipTone, { bg: string; color: string; border: string }> = {
  default: {
    bg: T.sunk,
    color: T.ink,
    border: T.line,
  },
  red: {
    bg: T.orangeSoft,
    color: T.orangeDeep,
    border: 'rgba(255,102,0,0.24)',
  },
  green: {
    bg: T.goodSoft,
    color: T.good,
    border: 'rgba(31,169,113,0.24)',
  },
  mute: {
    bg: 'transparent',
    color: T.inkSoft,
    border: T.lineStrong,
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
    borderRadius: 999,
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
