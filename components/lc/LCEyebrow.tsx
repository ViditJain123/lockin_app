// Lockin Club — eyebrow label
// Small mono-caps label used above display headlines and as section tags.
// Source: design-reference/lockin-club/project/tokens.jsx (LCTitle eyebrow)

import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { T } from '@/constants/Theme';
import { Fonts } from '@/constants/Fonts';

type Tone = 'default' | 'red' | 'dim';

const toneColor: Record<Tone, string> = {
  default: T.inkMute,
  red: T.orange,
  dim: T.inkMute,
};

type LCEyebrowProps = {
  children: React.ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md';
  style?: StyleProp<TextStyle>;
};

export function LCEyebrow({ children, tone = 'default', size = 'md', style }: LCEyebrowProps) {
  const fontSize = size === 'sm' ? 9 : 10;
  const letterSpacing = size === 'sm' ? 1.5 : 2;
  return (
    <Text
      style={[
        {
          fontFamily: Fonts.monoMedium,
          fontSize,
          letterSpacing,
          color: toneColor[tone],
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export default LCEyebrow;
