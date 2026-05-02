import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface LCStatProps {
  label: string;
  value: string;
  unit?: string;
  size?: number;
  align?: 'left' | 'center' | 'right';
  unitColor?: string;
  valueColor?: string;
  style?: ViewStyle;
}

export default function LCStat({
  label,
  value,
  unit,
  size = 40,
  align = 'left',
  unitColor = LC.red,
  valueColor = LC.text,
  style,
}: LCStatProps) {
  return (
    <View style={[{ alignItems: alignToFlex(align) }, style]}>
      <Text style={[styles.label, { textAlign: align }]}>
        {label.toUpperCase()}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text
          style={[
            styles.value,
            {
              fontSize: size,
              lineHeight: Math.round(size * 0.9),
              color: valueColor,
            },
          ]}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={[
              styles.value,
              {
                fontSize: size,
                lineHeight: Math.round(size * 0.9),
                color: unitColor,
              },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function alignToFlex(a: 'left' | 'center' | 'right') {
  return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.6,
    color: LC.textMute,
    marginBottom: 4,
  },
  value: {
    fontFamily: Fonts.display,
    letterSpacing: -0.5,
  },
});
