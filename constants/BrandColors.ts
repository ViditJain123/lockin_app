// Brand Colors for LockIn App
// Centralized theme colors for consistent styling throughout the app

export const BrandColors = {
  // Core brand palette
  palette: {
    orange: '#FF6600',
    yellow: '#FFC93C',
    ink: '#0E0E0E',
    white: '#FFFFFF',
  },

  // Primary gradient colors (orange theme)
  primary: {
    gradientStart: '#FF8533',   // Lighter orange
    gradientMid: '#FF6600',     // Brand orange
    gradientEnd: '#E05A00',     // Darker orange
    main: '#FF6600',            // Main brand color
    dark: '#B34700',            // Dark variant
  },

  // Progress bar colors
  progressBar: {
    background: 'rgba(255, 255, 255, 0.15)',
    fill: '#FF6600',
    fillGradientStart: '#FF8533',
    fillGradientEnd: '#E05A00',
  },

  // Input field colors
  input: {
    background: '#1A1A1A',
    border: '#333333',
    borderFocused: '#FF6600',
    placeholder: 'rgba(255, 255, 255, 0.4)',
    text: '#FFFFFF',
  },

  // Button states
  button: {
    activeGradient: ['#FF8533', '#FF6600', '#E05A00', '#B34700'] as const,
    disabledBackground: '#333333',
    disabledText: 'rgba(255, 255, 255, 0.4)',
  },

  // Cloud/aurora background
  cloud: {
    primary: 'rgba(255,102,0, 0.4)',
    secondary: 'rgba(255,102,0, 0.3)',
    tertiary: 'rgba(224,90,0, 0.2)',
    glow: 'rgba(255,133,51, 0.15)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.5)',
    accent: '#FF6600',
  },

  // Background colors
  background: {
    primary: '#0E0E0E',
    secondary: '#0E0E0E',
    card: '#1A1A1A',
  },
} as const;

export type BrandColorKey = keyof typeof BrandColors;

// ─────────────────────────────────────────────────────────────
// LC — Lockin Club tokens, dark ink / orange / yellow theme (see constants/Theme.ts)
// Source: design-reference/lockin-club/project/tokens.jsx
// Kept separate from BrandColors so existing screens are untouched
// during the rollout. New surfaces should pull from LC.
// ─────────────────────────────────────────────────────────────

export const LC = {
  // Surfaces — dark theme (mirrors constants/Theme.ts)
  bg: '#0A0A0A',
  bgElev: '#161616',
  bgCard: '#161616',

  // Rules
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',

  // Text
  text: '#F5F2EC',
  textDim: 'rgba(245,242,236,0.64)',
  textMute: 'rgba(245,242,236,0.38)',

  // Accent (brand orange; `red*` names kept for compatibility)
  red: '#FF6600',
  redDeep: '#C24E00',
  redGlow: 'rgba(255,102,0,0.30)',

  // Utility
  green: '#3DDC97',
  amber: '#FFC93C',

  // Receipt paper (thermal-printer reward card)
  paper: '#1E1E1E',
} as const;

export type LCColorKey = keyof typeof LC;
