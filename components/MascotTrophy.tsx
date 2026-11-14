import React, { memo } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import type { CrystalTier } from '@/constants/Crystals';

// Trophies are collectible versions of the Lockin Club mascot: the same robot
// from the app icon on a tier-coloured tile, each with its own accessory.
// Everything is drawn in the icon's 220px grid (see components/Mascot.tsx).

export type TrophyAccessory =
  | 'none'
  | 'sprout'
  | 'headphones'
  | 'moon'
  | 'glasses'
  | 'sweatband'
  | 'coffee'
  | 'cap'
  | 'shades'
  | 'bolt'
  | 'flame'
  | 'scarf'
  | 'nightcap'
  | 'bowtie'
  | 'medal'
  | 'star'
  | 'rocket'
  | 'laurel'
  | 'cape'
  | 'wizard'
  | 'plume'
  | 'diamond'
  | 'astronaut'
  | 'ninja'
  | 'wings'
  | 'halo'
  | 'crown'
  | 'golden'
  | 'shadow'
  | 'legend';

const INK = '#0E0E0E';
const ORANGE = '#FF6600';
const YELLOW = '#FFC93C';
const WHITE = '#FFFFFF';
const GOLD = '#E8A400';
const GREEN = '#1FA971';

interface TileStyle {
  from: string;
  to: string;
  rim: string;
}

const TILES: Record<CrystalTier, TileStyle> = {
  common: { from: '#FFF4E8', to: '#FFE6CF', rim: '#F3D6BA' },
  uncommon: { from: '#FFD763', to: '#FFBE2E', rim: '#F0AE1E' },
  rare: { from: '#FF7A1F', to: '#FF5A00', rim: '#E04E00' },
  epic: { from: '#FFB000', to: '#FF4D00', rim: '#E04300' },
  mythic: { from: '#2A2A2A', to: '#0E0E0E', rim: '#FFC93C' },
};

// Full-screen colour for the trophy detail page, with readable text on it
export const TROPHY_FLOOD: Record<CrystalTier, { bg: string; fg: string }> = {
  common: { bg: '#FFE6CF', fg: '#0E0E0E' },
  uncommon: { bg: '#FFC93C', fg: '#0E0E0E' },
  rare: { bg: '#FF6600', fg: '#0E0E0E' },
  epic: { bg: '#FF4D00', fg: '#0E0E0E' },
  mythic: { bg: '#0E0E0E', fg: '#F5F2EC' },
};

interface MascotTrophyProps {
  tier: CrystalTier;
  accessory: TrophyAccessory;
  size: number;
  locked?: boolean;
}

function MascotTrophy({ tier, accessory, size, locked = false }: MascotTrophyProps) {
  // Locked trophies render as a flat silhouette of the same shape
  const mono = locked ? '#222222' : null;
  const monoDark = locked ? '#333333' : null;
  // Silhouettes: accessories and body in the darker tone so the shape reads,
  // tile and face in the lighter one
  const c = (color: string) => monoDark ?? color;
  const cd = (color: string) => monoDark ?? color;
  const cl = (color: string) => mono ?? color;

  const tile = TILES[tier];
  const id = `t-${tier}-${accessory}-${locked ? 'l' : 'u'}`;

  const isGolden = accessory === 'golden' || accessory === 'legend';
  const isShadow = accessory === 'shadow';
  const body = isGolden ? GOLD : isShadow ? '#262626' : INK;
  const screen = isGolden ? '#FFF3CC' : isShadow ? '#141414' : WHITE;
  const screenSide = isGolden ? '#FFD45C' : isShadow ? '#1F1F1F' : YELLOW;
  const eye = isShadow ? ORANGE : INK;

  const hasHat = ['cap', 'nightcap', 'wizard', 'crown', 'legend', 'plume', 'flame', 'sprout'].includes(
    accessory
  );

  const sparkle = (x: number, y: number, r: number, color: string) => (
    <Path
      d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`}
      fill={c(color)}
    />
  );

  // Layers drawn behind the mascot
  const back = () => {
    switch (accessory) {
      case 'cape':
        return <Path d="M58 150 L162 150 L188 214 L32 214 Z" fill={c(INK)} opacity={locked ? 1 : 0.9} />;
      case 'wings':
        return (
          <G>
            <Path d="M70 150 C40 120, 10 130, 8 160 C30 150, 30 175, 14 190 C45 190, 62 180, 78 168 Z" fill={c(YELLOW)} />
            <Path d="M150 150 C180 120, 210 130, 212 160 C190 150, 190 175, 206 190 C175 190, 158 180, 142 168 Z" fill={c(YELLOW)} />
          </G>
        );
      case 'astronaut':
        return <Circle cx={110} cy={118} r={92} fill={c('rgba(255,255,255,0.22)')} />;
      case 'laurel': {
        const leaves = [];
        // Leaves along the left arc of a circle around the mascot, mirrored right
        for (let i = 0; i < 6; i++) {
          const deg = 120 + i * 22;
          const a = deg * (Math.PI / 180);
          const lx = 110 + Math.cos(a) * 88;
          const ly = 122 + Math.sin(a) * 88;
          const rx = 220 - lx;
          const rot = deg;
          leaves.push(
            <Ellipse key={`l${i}`} cx={lx} cy={ly} rx={7} ry={15} fill={c(GOLD)} transform={`rotate(${rot} ${lx} ${ly})`} />,
            <Ellipse key={`r${i}`} cx={rx} cy={ly} rx={7} ry={15} fill={c(GOLD)} transform={`rotate(${-rot} ${rx} ${ly})`} />
          );
        }
        return <G>{leaves}</G>;
      }
      default:
        return null;
    }
  };

  // Layers drawn on top of the mascot
  const front = () => {
    switch (accessory) {
      case 'sprout':
        return (
          <G>
            <Path d="M110 62 V30" stroke={c(GREEN)} strokeWidth={6} strokeLinecap="round" />
            <Ellipse cx={96} cy={30} rx={14} ry={8} fill={c(GREEN)} transform="rotate(-25 96 30)" />
            <Ellipse cx={124} cy={24} rx={14} ry={8} fill={c(GREEN)} transform="rotate(25 124 24)" />
          </G>
        );
      case 'headphones':
        return (
          <G>
            <Path d="M38 112 C38 30, 182 30, 182 112" stroke={c(INK)} strokeWidth={10} fill="none" strokeLinecap="round" />
            <Rect x={26} y={88} width={24} height={46} rx={10} fill={c(ORANGE)} stroke={c(INK)} strokeWidth={5} />
            <Rect x={170} y={88} width={24} height={46} rx={10} fill={c(ORANGE)} stroke={c(INK)} strokeWidth={5} />
          </G>
        );
      case 'moon':
        return <Path d="M44 14 A26 26 0 1 0 70 52 A20 20 0 1 1 44 14 Z" fill={c(YELLOW)} stroke={c(INK)} strokeWidth={4} />;
      case 'glasses':
        return (
          <G>
            <Circle cx={99.5} cy={103} r={17} stroke={c(INK)} strokeWidth={5} fill="none" />
            <Circle cx={138.5} cy={103} r={17} stroke={c(INK)} strokeWidth={5} fill="none" />
            <Path d="M116 102 H122" stroke={c(INK)} strokeWidth={5} />
          </G>
        );
      case 'shades':
        return (
          <G>
            <Rect x={82} y={92} width={35} height={24} rx={8} fill={c(INK)} />
            <Rect x={121} y={92} width={35} height={24} rx={8} fill={c(INK)} />
            <Path d="M112 100 H126" stroke={c(INK)} strokeWidth={5} />
            <Path d="M88 97 L98 97" stroke={c(WHITE)} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          </G>
        );
      case 'sweatband':
        return (
          <G>
            <Rect x={40} y={62} width={139} height={14} rx={5} fill={c(ORANGE)} />
            <Rect x={40} y={67} width={139} height={4} fill={c(WHITE)} />
          </G>
        );
      case 'ninja':
        return (
          <G>
            <Rect x={40} y={64} width={139} height={14} rx={4} fill={c(ORANGE)} />
            <Path d="M176 70 C196 66, 204 76, 214 70 M176 74 C192 84, 200 92, 212 90" stroke={c(ORANGE)} strokeWidth={7} strokeLinecap="round" fill="none" />
          </G>
        );
      case 'coffee':
        return (
          <G>
            <Rect x={154} y={146} width={30} height={34} rx={5} fill={c(WHITE)} stroke={c(INK)} strokeWidth={5} />
            <Path d="M184 154 C196 154, 196 172, 184 172" stroke={c(INK)} strokeWidth={5} fill="none" />
            <Path d="M162 138 C158 130, 166 126, 162 118 M175 138 C171 130, 179 126, 175 118" stroke={c(INK)} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          </G>
        );
      case 'cap':
        return (
          <G>
            <Path d="M46 66 C46 22, 174 22, 174 66 Z" fill={c(INK)} />
            <Rect x={150} y={56} width={52} height={12} rx={6} fill={c(INK)} />
            <Circle cx={110} cy={28} r={5} fill={c(ORANGE)} />
          </G>
        );
      case 'bolt':
        return <Path d="M186 10 L160 54 L178 54 L166 92 L202 42 L182 42 L196 10 Z" fill={c(YELLOW)} stroke={c(INK)} strokeWidth={4} strokeLinejoin="round" />;
      case 'flame':
        return (
          <G>
            <Path d="M110 4 C130 24, 146 34, 140 56 C136 66, 84 66, 80 56 C74 40, 92 30, 96 16 C102 26, 104 30, 110 4 Z" fill={c(ORANGE)} stroke={c(INK)} strokeWidth={4} />
            <Path d="M110 30 C120 40, 126 48, 122 58 L98 58 C94 48, 104 42, 110 30 Z" fill={c(YELLOW)} />
          </G>
        );
      case 'scarf':
        return (
          <G>
            <Rect x={62} y={148} width={96} height={16} rx={8} fill={c(ORANGE)} />
            <Rect x={124} y={156} width={16} height={36} rx={4} fill={c(ORANGE)} />
            <Path d="M126 182 H138" stroke={c(WHITE)} strokeWidth={3} />
          </G>
        );
      case 'nightcap':
        return (
          <G>
            <Path d="M44 66 C60 20, 150 6, 196 30 C170 34, 176 50, 176 66 Z" fill={c('#3B4BCC')} />
            <Rect x={40} y={58} width={140} height={14} rx={7} fill={c(WHITE)} />
            <Circle cx={198} cy={30} r={11} fill={c(WHITE)} />
          </G>
        );
      case 'bowtie':
        return (
          <G>
            <Path d="M88 150 L110 160 L88 172 Z M132 150 L110 160 L132 172 Z" fill={c(ORANGE)} stroke={c(INK)} strokeWidth={3} strokeLinejoin="round" />
            <Circle cx={110} cy={160} r={6} fill={c(INK)} />
          </G>
        );
      case 'medal':
        return (
          <G>
            <Path d="M94 150 L110 182 L126 150" stroke={c(ORANGE)} strokeWidth={10} fill="none" />
            <Circle cx={110} cy={190} r={15} fill={c(GOLD)} stroke={c(INK)} strokeWidth={4} />
            {sparkle(110, 190, 7, WHITE)}
          </G>
        );
      case 'star':
        return (
          <Path
            d="M184 14 L192 34 L214 35 L197 49 L203 70 L184 58 L165 70 L171 49 L154 35 L176 34 Z"
            fill={c(YELLOW)}
            stroke={c(INK)}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        );
      case 'rocket':
        return (
          <G transform="rotate(35 34 60)">
            <Path d="M34 14 C50 30, 50 74, 44 92 L24 92 C18 74, 18 30, 34 14 Z" fill={c(WHITE)} stroke={c(INK)} strokeWidth={4} />
            <Circle cx={34} cy={48} r={7} fill={c(ORANGE)} stroke={c(INK)} strokeWidth={3} />
            <Path d="M24 80 L12 98 L24 94 Z M44 80 L56 98 L44 94 Z" fill={c(ORANGE)} stroke={c(INK)} strokeWidth={3} />
            <Path d="M28 96 C30 108, 38 108, 40 96 Z" fill={c(YELLOW)} />
          </G>
        );
      case 'wizard':
        return (
          <G>
            <Path d="M44 66 L120 2 L176 66 Z" fill={c('#3B2A7A')} stroke={c(INK)} strokeWidth={4} strokeLinejoin="round" />
            <Rect x={34} y={58} width={152} height={12} rx={6} fill={c('#3B2A7A')} stroke={c(INK)} strokeWidth={3} />
            {sparkle(108, 36, 8, YELLOW)}
            {sparkle(134, 50, 5, YELLOW)}
          </G>
        );
      case 'plume':
        return (
          <G>
            <Path d="M52 64 C52 26, 168 26, 168 64 Z" fill={c(GOLD)} stroke={c(INK)} strokeWidth={4} />
            <Path d="M70 36 C80 4, 140 4, 150 36" stroke={c(ORANGE)} strokeWidth={14} strokeLinecap="round" fill="none" />
          </G>
        );
      case 'diamond':
        return (
          <G>
            <Path d="M160 134 L196 134 L206 148 L178 182 L150 148 Z" fill={c('#BFF1FF')} stroke={c(INK)} strokeWidth={4} strokeLinejoin="round" />
            <Path d="M150 148 H206 M170 134 L178 182 L186 134" stroke={c(INK)} strokeWidth={2.5} fill="none" />
          </G>
        );
      case 'astronaut':
        return (
          <G>
            <Circle cx={110} cy={118} r={92} stroke={c(WHITE)} strokeWidth={7} fill="none" />
            <Path d="M60 60 C70 44, 86 36, 100 34" stroke={c(WHITE)} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.8} />
          </G>
        );
      case 'halo':
        return <Ellipse cx={110} cy={22} rx={46} ry={11} stroke={c(YELLOW)} strokeWidth={8} fill="none" />;
      case 'crown':
      case 'legend':
        return (
          <G>
            <Path d="M58 66 L54 24 L84 46 L110 14 L136 46 L166 24 L162 66 Z" fill={c(YELLOW)} stroke={c(INK)} strokeWidth={4} strokeLinejoin="round" />
            <Circle cx={110} cy={48} r={6} fill={c(ORANGE)} />
            {accessory === 'legend' && (
              <G>
                {sparkle(30, 40, 12, YELLOW)}
                {sparkle(194, 92, 10, YELLOW)}
                {sparkle(28, 140, 8, WHITE)}
              </G>
            )}
          </G>
        );
      default:
        return null;
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 220 220">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={mono ?? tile.from} />
          <Stop offset="1" stopColor={mono ?? tile.to} />
        </LinearGradient>
      </Defs>

      {/* Tile */}
      <Rect x={2} y={2} width={216} height={216} rx={52} fill={`url(#${id})`} stroke={cd(tile.rim)} strokeWidth={4} />
      {!locked && <Path d="M30 40 C40 20, 70 12, 100 12" stroke={WHITE} strokeWidth={6} strokeLinecap="round" opacity={0.35} fill="none" />}

      {back()}

      {/* Mascot */}
      {!hasHat && <Path d="M93 64 V52 A15 15 0 0 1 123 52 V64" stroke={cd(body)} strokeWidth={10} fill="none" />}
      <Rect x={44} y={60} width={131} height={100} rx={16} fill={cd(body)} />
      <Rect x={56} y={72} width={107} height={75} rx={6} fill={cl(screenSide)} />
      <Rect x={76} y={72} width={87} height={64} rx={6} fill={cl(screen)} />
      {accessory !== 'shades' && (
        <G>
          <Rect x={92} y={87} width={15} height={33} rx={7.5} fill={cd(eye)} />
          <Rect x={131} y={87} width={15} height={33} rx={7.5} fill={cd(eye)} />
        </G>
      )}
      <Rect x={83} y={155} width={55} height={33} fill={cd(body)} />
      <Rect x={83} y={160} width={21} height={47} rx={3} fill={cd(body)} />
      <Rect x={117} y={160} width={21} height={47} rx={3} fill={cd(body)} />
      <Rect x={53} y={167} width={20} height={31} rx={3} fill={cd(body)} />
      <Rect x={144} y={167} width={32} height={21} rx={3} fill={cd(body)} />

      {front()}

      {/* Rarity sparkle for the top tiers */}
      {!locked && (tier === 'epic' || tier === 'mythic') && accessory !== 'legend' && (
        <G>
          {sparkle(196, 190, 9, tier === 'mythic' ? YELLOW : WHITE)}
          {sparkle(24, 186, 6, tier === 'mythic' ? YELLOW : WHITE)}
        </G>
      )}
    </Svg>
  );
}

export default memo(MascotTrophy);
