import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface LCDisplayProps {
  lineOne: string;
  lineTwo?: string;
  accent?: 'one' | 'two';
  accentColor?: string;
  size?: number;
  style?: TextStyle;
}

export default function LCDisplay({
  lineOne,
  lineTwo,
  accent = 'two',
  accentColor = LC.red,
  size = 44,
  style,
}: LCDisplayProps) {
  const oneColor = accent === 'one' ? accentColor : LC.text;
  const twoColor = accent === 'two' ? accentColor : LC.text;

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: size,
          lineHeight: Math.round(size * 1.05),
          paddingTop: Math.round(size * 0.05),
        },
        style,
      ]}
    >
      <Text style={{ color: oneColor }}>{lineOne.toUpperCase()}</Text>
      {lineTwo ? (
        <>
          {'\n'}
          <Text style={{ color: twoColor }}>{lineTwo.toUpperCase()}</Text>
        </>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.display,
    letterSpacing: 0.5,
  },
});
