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
// LC — Lockin Club redesign tokens (Gritty Hardcore direction)
// Source: design-reference/lockin-club/project/tokens.jsx
// Kept separate from BrandColors so existing screens are untouched
// during the rollout. New surfaces should pull from LC.
// ─────────────────────────────────────────────────────────────

export const LC = {
  // Surfaces
  bg: '#0E0E0E',
  bgElev: '#141414',
  bgCard: '#1a1a1a',

  // Rules
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  // Text
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.35)',

  // Accent (brand orange; `red*` names kept for compatibility)
  red: '#FF6600',
  redDeep: '#B34700',
  redGlow: 'rgba(255,102,0,0.25)',

  // Utility
  green: '#4ade80',
  amber: '#FFC93C',

  // Receipt paper (thermal-printer reward card)
  paper: '#e9e4d8',
} as const;

export type LCColorKey = keyof typeof LC;
