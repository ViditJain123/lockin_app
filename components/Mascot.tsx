import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { BrandColors } from '../constants/BrandColors';

// Mascot artwork traced from the app icon, in the icon's own 220px grid.
// The eyes are separate views so they can blink/wink.
const VIEWBOX = { x: 0, y: 0, width: 220, height: 220 };
const INK = BrandColors.palette.ink;

const EYE = { width: 15, height: 33, top: 87 };
const LEFT_EYE_X = 92;
const RIGHT_EYE_X = 131;

interface MascotProps {
  size: number;
  // 1 = open, 0 = closed. Drives the vertical scale of the right eye.
  rightEyeOpen?: SharedValue<number>;
}

export default function Mascot({ size, rightEyeOpen }: MascotProps) {
  const scale = size / VIEWBOX.width;
  const height = VIEWBOX.height * scale;

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: rightEyeOpen ? Math.max(rightEyeOpen.value, 0.08) : 1 }],
  }));

  const eyeBox = (x: number) => ({
    left: (x - VIEWBOX.x) * scale,
    top: (EYE.top - VIEWBOX.y) * scale,
    width: EYE.width * scale,
    height: EYE.height * scale,
    borderRadius: (EYE.width / 2) * scale,
  });

  return (
    <View style={{ width: size, height }}>
      <Svg
        width={size}
        height={height}
        viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`}
      >
        {/* Tile */}
        <Rect x={0} y={0} width={220} height={220} rx={50} fill={BrandColors.palette.orange} />
        {/* Handle */}
        <Path d="M93 64 V52 A15 15 0 0 1 123 52 V64" stroke={INK} strokeWidth={10} fill="none" />
        {/* Head */}
        <Rect x={44} y={60} width={131} height={100} rx={16} fill={INK} />
        <Rect x={56} y={72} width={107} height={75} rx={6} fill={BrandColors.palette.yellow} />
        <Rect x={76} y={72} width={87} height={64} rx={6} fill={BrandColors.palette.white} />
        {/* Body and legs */}
        <Rect x={83} y={155} width={55} height={33} fill={INK} />
        <Rect x={83} y={160} width={21} height={47} rx={3} fill={INK} />
        <Rect x={117} y={160} width={21} height={47} rx={3} fill={INK} />
        {/* Arms */}
        <Rect x={53} y={167} width={20} height={31} rx={3} fill={INK} />
        <Rect x={144} y={167} width={32} height={21} rx={3} fill={INK} />
      </Svg>

      <View style={[styles.eye, eyeBox(LEFT_EYE_X)]} />
      <Animated.View style={[styles.eye, eyeBox(RIGHT_EYE_X), rightEyeStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  eye: {
    position: 'absolute',
    backgroundColor: INK,
  },
});
