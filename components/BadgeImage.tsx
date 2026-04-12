import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getBadgeById } from '@/constants/Badges';
import { getBadgeAssetModule } from '@/lib/badgeAssetCache';

// Memoized BadgeImage component to prevent unnecessary re-renders

interface BadgeImageProps {
  badgeId: string;
  size: number;
  locked?: boolean;
}

function BadgeImage({
  badgeId,
  size,
  locked = false,
}: BadgeImageProps) {
  const assetModule = getBadgeAssetModule(badgeId);
  const badge = getBadgeById(badgeId);

  if (!badge || !assetModule) {
    // Fallback placeholder
    return (
      <View
        style={[
          styles.placeholder,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Ionicons name="trophy" size={size * 0.4} color="rgba(255,255,255,0.3)" />
      </View>
    );
  }

  const renderBadgeImage = () => {
    return (
      <Image
        source={assetModule}
        style={[
          styles.image,
          { width: size, height: size },
          locked && styles.lockedImage,
        ]}
        resizeMode="contain"
      />
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Badge image */}
      {renderBadgeImage()}

      {/* Blur overlay for locked badges */}
      {locked && (
        <View style={[styles.blurContainer, { width: size, height: size }]}>
          <BlurView
            intensity={30}
            tint="dark"
            style={[styles.blur, { width: size, height: size }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    zIndex: 1,
  },
  lockedImage: {
    opacity: 0.5,
  },
  blurContainer: {
    position: 'absolute',
    zIndex: 2,
    overflow: 'hidden',
    borderRadius: 1000,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default memo(BadgeImage);
