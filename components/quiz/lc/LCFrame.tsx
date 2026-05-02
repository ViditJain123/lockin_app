import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { LC } from '../../../constants/LockinClubColors';

type GlowPosition = 'top' | 'center' | 'bottom' | 'none';
type GlowIntensity = 'subtle' | 'normal' | 'strong';

interface LCFrameProps {
  children: React.ReactNode;
  glow?: GlowPosition;
  glowColor?: string;
  glowIntensity?: GlowIntensity;
  style?: ViewStyle;
}

const GLOW_OFFSET: Record<GlowPosition, string> = {
  top: '20%',
  center: '35%',
  bottom: '70%',
  none: '50%',
};

const INTENSITY_OPACITY: Record<GlowIntensity, number> = {
  subtle: 0.4,
  normal: 0.6,
  strong: 0.85,
};

export default function LCFrame({
  children,
  glow = 'none',
  glowColor = LC.redGlow,
  glowIntensity = 'subtle',
  style,
}: LCFrameProps) {
  const insets = useSafeAreaInsets();
  const peakOpacity = INTENSITY_OPACITY[glowIntensity];

  return (
    <View style={[styles.root, style]}>
      {glow !== 'none' && (
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
        >
          <Defs>
            <RadialGradient
              id="lcGlow"
              cx="50%"
              cy={GLOW_OFFSET[glow]}
              rx="55%"
              ry="32%"
            >
              <Stop offset="0%" stopColor={glowColor} stopOpacity={peakOpacity} />
              <Stop offset="60%" stopColor={glowColor} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#lcGlow)" />
        </Svg>
      )}
      <View style={[styles.inner, { paddingTop: insets.top }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LC.bg,
  },
  inner: {
    flex: 1,
  },
});
