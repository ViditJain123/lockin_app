import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { BrandColors } from '../../constants/BrandColors';
import { Fonts } from '../../constants/Fonts';
import { buttonPress } from '../../lib/haptics';

export const GLOW_CARD_WIDTH = 168;
export const GLOW_CARD_HEIGHT = 224;

// Blob silhouettes drawn in the card's own coordinate space
const SHAPES = {
  wave: 'M-20 240 C -10 160, 10 105, 55 100 C 100 95, 95 150, 130 130 C 160 112, 190 120, 190 170 L 190 240 Z',
  crown: 'M8 240 L 14 112 L 50 150 L 84 82 L 118 150 L 154 112 L 160 240 Z',
  orb: 'M84 92 A 70 70 0 1 1 83.9 92 Z',
  peak: 'M-20 240 L 30 140 C 50 110, 66 112, 84 78 C 102 112, 118 110, 138 140 L 188 240 Z',
  ripple: 'M84 74 C 146 74, 176 128, 166 182 C 156 236, 112 250, 84 250 C 56 250, 12 236, 2 182 C -8 128, 22 74, 84 74 Z M84 136 A 32 32 0 1 0 84.1 136 Z',
} as const;

export type GlowShape = keyof typeof SHAPES;

interface GlowCardProps {
  title: string;
  subtitle: string;
  shape: GlowShape;
  onPress: () => void;
}

export default function GlowCard({ title, subtitle, shape, onPress }: GlowCardProps) {
  const gradientId = `glow-${shape}`;

  return (
    <Pressable
      onPress={() => {
        buttonPress();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Svg
        width={GLOW_CARD_WIDTH}
        height={GLOW_CARD_HEIGHT}
        viewBox={`0 0 ${GLOW_CARD_WIDTH} ${GLOW_CARD_HEIGHT}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="68%" r="55%">
            <Stop offset="0" stopColor={BrandColors.palette.yellow} stopOpacity={1} />
            <Stop offset="0.45" stopColor={BrandColors.palette.orange} stopOpacity={0.95} />
            <Stop offset="1" stopColor={BrandColors.primary.dark} stopOpacity={0.2} />
          </RadialGradient>
        </Defs>
        <Path d={SHAPES[shape]} fill={`url(#${gradientId})`} fillRule="evenodd" />
      </Svg>

      {/* Frosted layer softens the blob into a glow */}
      <BlurView intensity={30} tint="systemUltraThinMaterialDark" style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={14} color={BrandColors.palette.white} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: GLOW_CARD_WIDTH,
    height: GLOW_CARD_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1A1410',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 201, 60, 0.25)',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: BrandColors.palette.white,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
