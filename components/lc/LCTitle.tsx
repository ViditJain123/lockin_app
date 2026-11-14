// Lockin Club — title block
// Eyebrow + large display headline stack (Bebas Neue).
// Source: design-reference/lockin-club/project/tokens.jsx (LCTitle)

import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { T } from '@/constants/Theme';
import { Fonts } from '@/constants/Fonts';

import { LCEyebrow } from './LCEyebrow';

type LCTitleProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const SIZE: Record<'sm' | 'md' | 'lg', { fontSize: number; lineHeight: number }> = {
  sm: { fontSize: 26, lineHeight: 27 },
  md: { fontSize: 42, lineHeight: 39 },
  lg: { fontSize: 52, lineHeight: 47 },
};

export function LCTitle({ eyebrow, title, size = 'md', style }: LCTitleProps) {
  const s = SIZE[size];
  return (
    <View style={style}>
      {eyebrow ? <LCEyebrow style={styles.eyebrow}>{eyebrow}</LCEyebrow> : null}
      <Text style={[styles.title, { fontSize: s.fontSize, lineHeight: s.lineHeight }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    marginBottom: 8,
  },
  title: {
    fontFamily: Fonts.display,
    color: T.ink,
    letterSpacing: 0.5,
  },
});

export default LCTitle;
