// Lockin Club — dashed-border placeholder
// Used for empty media slots (e.g. timelapse thumbnails still processing).
// Source: design-reference/lockin-club/project/tokens.jsx (LCPlaceholder)

import React from 'react';
import {
  DimensionValue,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

type LCPlaceholderProps = {
  label?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
};

export function LCPlaceholder({
  label = 'image',
  width = '100%',
  height = 120,
  style,
}: LCPlaceholderProps) {
  return (
    <View style={[styles.box, { width, height }, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: LC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.monoRegular,
    fontSize: 10,
    color: LC.textMute,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default LCPlaceholder;
