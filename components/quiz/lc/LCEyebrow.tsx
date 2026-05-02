import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface LCEyebrowProps {
  text: string;
  step?: { current: number; total: number };
  tone?: 'red' | 'green' | 'mute';
  style?: ViewStyle;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function LCEyebrow({
  text,
  step,
  tone = 'red',
  style,
}: LCEyebrowProps) {
  const color = tone === 'red' ? LC.red : tone === 'green' ? LC.green : LC.textMute;
  const suffix = step ? ` · ${pad(step.current)} / ${pad(step.total)}` : '';
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.text, { color }]}>{`◆ ${text.toUpperCase()}${suffix}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 2.2,
  },
});
