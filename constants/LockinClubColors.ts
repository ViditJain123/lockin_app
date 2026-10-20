// Lockin Club design tokens — ink black + brand orange accent
// Brand palette: orange #FF6600, yellow #FFC93C, ink #0E0E0E, white #FFFFFF
// (`red*` keys are kept for compatibility; they hold the orange accent)

export const LC = {
  bg: '#0E0E0E',
  bgElev: '#141414',
  bgCard: '#1a1a1a',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.35)',

  red: '#FF6600',
  redDeep: '#B34700',
  redGlow: 'rgba(255,102,0,0.30)',
  redSoft: 'rgba(255,102,0,0.10)',
  redTint: 'rgba(255,102,0,0.08)',

  green: '#4ade80',
  greenSoft: 'rgba(74,222,128,0.10)',
  greenGlow: 'rgba(74,222,128,0.25)',

  amber: '#FFC93C',

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
