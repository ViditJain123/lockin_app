import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

import { Fonts } from '../../../constants/Fonts';
import { LC } from '../../../constants/LockinClubColors';

interface LCBodyProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
}

export default function LCBody({
  children,
  size = 13,
  color = LC.textDim,
  style,
  align = 'left',
}: LCBodyProps) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize: size, color, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.interRegular,
    lineHeight: 18,
  },
});
