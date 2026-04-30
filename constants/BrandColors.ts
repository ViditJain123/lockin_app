// Brand Colors for LockIn App
// Centralized theme colors for consistent styling throughout the app

export const BrandColors = {
  // Primary gradient colors (red/pink theme)
  primary: {
    gradientStart: '#FF6B82',   // Lighter pink
    gradientMid: '#F04560',     // Mid pink/red
    gradientEnd: '#C83050',     // Darker red
    main: '#FF3B5C',            // Main brand color
    dark: '#A02040',            // Dark variant
  },

  // Progress bar colors
  progressBar: {
    background: 'rgba(255, 255, 255, 0.15)',
    fill: '#FF3B5C',
    fillGradientStart: '#FF6B82',
    fillGradientEnd: '#E03050',
  },

  // Input field colors
  input: {
    background: '#1C1C1E',
    border: '#3A3A3C',
    borderFocused: '#FF3B5C',
    placeholder: 'rgba(255, 255, 255, 0.4)',
    text: '#FFFFFF',
  },

  // Button states
  button: {
    activeGradient: ['#FF6B82', '#F04560', '#C83050', '#A02040'] as const,
    disabledBackground: '#3A3A3C',
    disabledText: 'rgba(255, 255, 255, 0.4)',
  },

  // Cloud/aurora background
  cloud: {
    primary: 'rgba(255, 59, 92, 0.4)',
    secondary: 'rgba(240, 69, 96, 0.3)',
    tertiary: 'rgba(200, 48, 80, 0.2)',
    glow: 'rgba(255, 107, 130, 0.15)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.5)',
    accent: '#FF3B5C',
  },

  // Background colors
  background: {
    primary: '#000000',
    secondary: '#0A0A0A',
    card: '#1C1C1E',
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
  bg: '#0a0a0a',
  bgElev: '#141414',
  bgCard: '#1a1a1a',

  // Rules
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  // Text
  text: '#f4f1ea',
  textDim: 'rgba(244,241,234,0.6)',
  textMute: 'rgba(244,241,234,0.35)',

  // Accent (red hot-stamp)
  red: '#FF3B5C',
  redDeep: '#A02040',
  redGlow: 'rgba(255,59,92,0.25)',

  // Utility
  green: '#4ade80',
  amber: '#fbbf24',

  // Receipt paper (thermal-printer reward card)
  paper: '#e9e4d8',
} as const;

export type LCColorKey = keyof typeof LC;
