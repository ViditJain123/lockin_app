// Font family names for consistent usage throughout the app
// Quicksand + Inter are legacy; Bebas Neue + JetBrains Mono belong to the
// Lockin Club redesign (see design-reference/lockin-club/project/tokens.jsx).

export const Fonts = {
  // Quicksand weights
  light: 'Quicksand_300Light',
  regular: 'Quicksand_400Regular',
  medium: 'Quicksand_500Medium',
  semiBold: 'Quicksand_600SemiBold',
  bold: 'Quicksand_700Bold',

  // Inter weights
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  interExtraBold: 'Inter_800ExtraBold',

  // Lockin Club display (Bebas Neue) — hero numerals + ALL CAPS titles
  display: 'BebasNeue_400Regular',

  // Lockin Club mono (JetBrains Mono) — eyebrows, metrics, chrome labels
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',

  // DM Sans (LOCKIN CLUB wordmark)
  dmSansBold: 'DMSans_700Bold',
} as const;

// Type for font family
export type FontFamily = typeof Fonts[keyof typeof Fonts];

