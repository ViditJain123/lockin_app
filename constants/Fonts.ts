// Font family names for consistent usage throughout the app
// Using Quicksand and Inter from Google Fonts

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
} as const;

// Type for font family
export type FontFamily = typeof Fonts[keyof typeof Fonts];

