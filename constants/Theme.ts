// Lockin Club dark theme — the logo's palette: ink black, orange, yellow.
// Near-black canvas, graphite tiles with hairline rims (car-dashboard bento),
// orange as the primary accent and yellow for highlights / achievements.
//
// Note: `ink` is the *primary text* colour (warm off-white) — the name is kept
// from the light theme so components didn't need renaming. Use `black` for
// true dark fills.

export const T = {
  // Surfaces
  canvas: '#0A0A0A',
  card: '#161616',
  cardHi: '#1E1E1E', // raised / pressed tile
  sunk: '#242424', // tracks, inactive chips, empty cells
  black: '#0E0E0E',

  // Text
  ink: '#F5F2EC',
  inkSoft: 'rgba(245,242,236,0.64)',
  inkMute: 'rgba(245,242,236,0.38)',
  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.12)',

  // Brand
  orange: '#FF6600',
  orangeDeep: '#C24E00',
  orangeSoft: 'rgba(255,102,0,0.14)',
  orangeGlow: 'rgba(255,102,0,0.35)',
  yellow: '#FFC93C',
  yellowSoft: 'rgba(255,201,60,0.14)',
  white: '#FFFFFF',

  // Status
  good: '#3DDC97',
  goodSoft: 'rgba(61,220,151,0.14)',
  bad: '#FF5C5C',
  badSoft: 'rgba(255,92,92,0.14)',
} as const;

export const RADIUS = { sm: 12, md: 18, lg: 24, xl: 32 } as const;

// Tiles read through a hairline rim on dark rather than a drop shadow
export const cardShadow = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
  shadowColor: '#000000',
  shadowOpacity: 0.4,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;
