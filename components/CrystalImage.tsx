import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import MascotTrophy from '@/components/MascotTrophy';
import { getCrystalById } from '@/constants/Crystals';
import { T } from '@/constants/Theme';

interface CrystalImageProps {
  crystalId: string;
  size: number;
  locked?: boolean;
}

// Renders a trophy (a Lockin mascot figure). Kept under its original name so
// every screen that shows trophies picks up the mascot art automatically.
function CrystalImage({ crystalId, size, locked = false }: CrystalImageProps) {
  const crystal = getCrystalById(crystalId);

  if (!crystal) {
    return <View style={[styles.fallback, { width: size, height: size }]} />;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <MascotTrophy tier={crystal.tier} accessory={crystal.accessory} size={size} locked={locked} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: T.sunk,
    borderRadius: 12,
  },
});

export default memo(CrystalImage);
