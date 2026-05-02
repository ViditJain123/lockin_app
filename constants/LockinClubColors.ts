// Lockin Club design tokens — gritty editorial: true-black + red accent
// Source of truth: /Lockin Club/tokens.jsx

export const LC = {
  bg: '#0a0a0a',
  bgElev: '#141414',
  bgCard: '#1a1a1a',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  text: '#f4f1ea',
  textDim: 'rgba(244,241,234,0.6)',
  textMute: 'rgba(244,241,234,0.35)',

  red: '#FF3B5C',
  redDeep: '#A02040',
  redGlow: 'rgba(255,59,92,0.30)',
  redSoft: 'rgba(255,59,92,0.10)',
  redTint: 'rgba(255,59,92,0.08)',

  green: '#4ade80',
  greenSoft: 'rgba(74,222,128,0.10)',
  greenGlow: 'rgba(74,222,128,0.25)',

  amber: '#fbbf24',

  paper: '#e9e4d8',
  paperInk: '#1a1510',

  white: '#ffffff',
} as const;

export const LC_RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
} as const;
