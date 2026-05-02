import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

type Tone = 'default' | 'red' | 'green' | 'mute' | 'amber';

interface LCChipProps {
  children: React.ReactNode;
  tone?: Tone;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

const TONES: Record<Tone, { bg: string; color: string; border: string }> = {
  default: {
    bg: 'rgba(255,255,255,0.08)',
    color: LC.text,
    border: 'rgba(255,255,255,0.08)',
  },
  red: {
    bg: 'rgba(255,59,92,0.14)',
    color: LC.red,
    border: 'rgba(255,59,92,0.3)',
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
  amber: {
    bg: 'rgba(251,191,36,0.12)',
    color: LC.amber,
    border: 'rgba(251,191,36,0.3)',
  },
};

export default function LCChip({
  children,
  tone = 'default',
  style,
  size = 'md',
}: LCChipProps) {
  const t = TONES[tone];
  const padV = size === 'sm' ? 2 : 4;
  const padH = size === 'sm' ? 6 : 8;
  const fontSize = size === 'sm' ? 9 : 10;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
          paddingVertical: padV,
          paddingHorizontal: padH,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: t.color, fontSize }]}>
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Fonts.monoMedium,
    letterSpacing: 1,
  },
});
