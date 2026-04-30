import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { LC } from '@/constants/BrandColors';
import { getCrystalById } from '@/constants/Crystals';
import { getCrystalAssetModule } from '@/lib/crystalAssetCache';

interface CrystalImageProps {
  crystalId: string;
  size: number;
  locked?: boolean;
}

function CrystalImage({ crystalId, size, locked = false }: CrystalImageProps) {
  const assetModule = getCrystalAssetModule(crystalId);
  const crystal = getCrystalById(crystalId);

  if (!assetModule || !crystal) {
    return <View style={[styles.fallback, { width: size, height: size }]} />;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image
        source={assetModule}
        style={[styles.img, { width: size, height: size }]}
        // tintColor turns unlocked crystals into uniform silhouettes
        tintColor={locked ? LC.borderStrong : undefined}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {},
  fallback: {
    backgroundColor: LC.bgCard,
    borderRadius: 12,
  },
});

export default memo(CrystalImage);
