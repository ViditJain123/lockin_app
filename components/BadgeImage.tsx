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
  showGlow?: boolean;
}

function BadgeImage({
  badgeId,
  size,
  locked = false,
  showGlow = false,
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
      {/* Glow effect for unlocked badges */}
      {showGlow && !locked && (
        <View
          style={[
            styles.glow,
            {
              width: size * 1.2,
              height: size * 1.2,
              borderRadius: (size * 1.2) / 2,
            },
          ]}
        />
      )}

      {/* Badge image */}
      {renderBadgeImage()}

      {/* Blur overlay for locked badges */}
      {locked && (
        <View style={[styles.blurContainer, { width: size, height: size }]}>
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.blur, { width: size, height: size }]}
          />
          {/* Lock icon overlay */}
          <View style={styles.lockIconContainer}>
            <View style={styles.lockIconBackground}>
              <Ionicons name="lock-closed" size={size * 0.2} color="white" />
            </View>
          </View>
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
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    shadowColor: '#FF3B5C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
  lockIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  lockIconBackground: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 100,
    padding: 8,
  },
});

export default memo(BadgeImage);
