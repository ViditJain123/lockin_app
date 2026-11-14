import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const INK = '#0E0E0E';

// Soft pastel tones, bright but not loud. The face frame is a lighter tint of the background.
export const MASCOT_VARIANTS = [
  { name: 'Peach', bg: '#F2A27E', frame: '#FFD9C2' },
  { name: 'Sage', bg: '#93CC8F', frame: '#D5F0D1' },
  { name: 'Sky', bg: '#82B4F0', frame: '#D3E5FB' },
  { name: 'Lilac', bg: '#C3A0EE', frame: '#E9DAFB' },
  { name: 'Butter', bg: '#F2CF72', frame: '#FFF0C2' },
  { name: 'Aqua', bg: '#6FD0C6', frame: '#CDF3EF' },
  { name: 'Rose', bg: '#F29AAE', frame: '#FFD8E1' },
  { name: 'Coral', bg: '#F58A78', frame: '#FFD3CB' },
  { name: 'Classic', bg: '#FF6600', frame: '#FFC93C' },
] as const;

// Classic (brand orange) is opt-in only; defaults come from the muted ones
const DEFAULT_POOL = MASCOT_VARIANTS.length - 1;

export function mascotVariantFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % DEFAULT_POOL;
}

/** The Lockin mascot inside a coloured circle, used as the default profile picture */
export default function MascotAvatar({ size, variant }: { size: number; variant: number }) {
  const v = MASCOT_VARIANTS[variant] ?? MASCOT_VARIANTS[0];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      {/* Same artwork as components/Mascot.tsx, framed square around the figure */}
      <Svg width={size} height={size} viewBox="10 28 200 200">
        <Circle cx={110} cy={128} r={100} fill={v.bg} />
        <Path d="M93 64 V52 A15 15 0 0 1 123 52 V64" stroke={INK} strokeWidth={10} fill="none" />
        <Rect x={44} y={60} width={131} height={100} rx={16} fill={INK} />
        <Rect x={56} y={72} width={107} height={75} rx={6} fill={v.frame} />
        <Rect x={76} y={72} width={87} height={64} rx={6} fill="#F7F3EC" />
        <Rect x={92} y={87} width={15} height={33} rx={7.5} fill={INK} />
        <Rect x={131} y={87} width={15} height={33} rx={7.5} fill={INK} />
        <Rect x={83} y={155} width={55} height={33} fill={INK} />
        <Rect x={83} y={160} width={21} height={47} rx={3} fill={INK} />
        <Rect x={117} y={160} width={21} height={47} rx={3} fill={INK} />
        <Rect x={53} y={167} width={20} height={31} rx={3} fill={INK} />
        <Rect x={144} y={167} width={32} height={21} rx={3} fill={INK} />
      </Svg>
    </View>
  );
}
