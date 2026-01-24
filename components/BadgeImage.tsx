import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { getBadgeById } from '@/constants/Badges';

// Badge image mapping - require all badge images statically
const BADGE_ASSETS: Record<string, number> = {
  // Hours badges
  'hours-1': require('../assets/images/lockinbadges/grindhour1.svg'),
  'hours-5': require('../assets/images/lockinbadges/grindhours5.svg'),
  'hours-10': require('../assets/images/lockinbadges/grindhours10.svg'),
  'hours-25': require('../assets/images/lockinbadges/grindhours25.svg'),
  'hours-50': require('../assets/images/lockinbadges/grindhours50.svg'),
  'hours-100': require('../assets/images/lockinbadges/grindhours100.svg'),
  // Grinds badges
  'grinds-1': require('../assets/images/lockinbadges/grinds1.svg'),
  'grinds-5': require('../assets/images/lockinbadges/grinds5.svg'),
  'grinds-10': require('../assets/images/lockinbadges/grinds10.svg'),
  'grinds-20': require('../assets/images/lockinbadges/grinds20.svg'),
  'grinds-50': require('../assets/images/lockinbadges/grinds50.svg'),
  'grinds-75': require('../assets/images/lockinbadges/grinds75.svg'),
  'grinds-100': require('../assets/images/lockinbadges/grinds100.svg'),
  // Streak badges
  'streak-3': require('../assets/images/lockinbadges/streak3.svg'),
  'streak-5': require('../assets/images/lockinbadges/streak5.svg'),
  'streak-10': require('../assets/images/lockinbadges/streak10.svg'),
  'streak-21': require('../assets/images/lockinbadges/streak21.svg'),
  'streak-30': require('../assets/images/lockinbadges/streak30.svg'),
};

interface BadgeImageProps {
  badgeId: string;
  size: number;
  locked?: boolean;
  showGlow?: boolean;
}

export default function BadgeImage({
  badgeId,
  size,
  locked = false,
  showGlow = false,
}: BadgeImageProps) {
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const badge = getBadgeById(badgeId);
  const assetModule = BADGE_ASSETS[badgeId];

  useEffect(() => {
    if (!assetModule) return;

    const loadAsset = async () => {
      try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        if (asset.localUri) {
          setAssetUri(asset.localUri);
        } else if (asset.uri) {
          setAssetUri(asset.uri);
        }
      } catch (error) {
        console.warn('[BadgeImage] Failed to load asset:', error);
        setUseFallback(true);
      }
    };

    loadAsset();
  }, [assetModule]);

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
    // Try to use SvgUri if we have a valid URI
    if (assetUri && !useFallback) {
      return (
        <SvgUri
          uri={assetUri}
          width={size}
          height={size}
          style={[locked && styles.lockedImage]}
          onError={() => setUseFallback(true)}
        />
      );
    }

    // Fallback to Image component (works with embedded data URIs)
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
