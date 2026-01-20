import React, { useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

interface ThumbnailItemProps {
  thumbnailUrl: string | null;
  videoUrl: string;
  size: number;
  onPress: () => void;
  marginLeft?: number;
  marginRight?: number;
}

export default function ThumbnailItem({
  thumbnailUrl,
  videoUrl,
  size,
  onPress,
  marginLeft = 0,
  marginRight = 0,
}: ThumbnailItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Start shimmer animation
  useEffect(() => {
    if (!isLoaded) {
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();
      return () => shimmerLoop.stop();
    }
  }, [isLoaded, shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const imageUri = thumbnailUrl || videoUrl;
  const height = size * 1.3;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          width: size,
          height: height,
          marginLeft,
          marginRight,
        },
      ]}
      activeOpacity={0.8}
    >
      {/* Shimmer placeholder - always rendered behind */}
      {!isLoaded && (
        <Animated.View
          style={[
            styles.placeholder,
            {
              opacity: shimmerOpacity,
            },
          ]}
        />
      )}

      {/* Actual thumbnail image */}
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.thumbnail,
          { opacity: isLoaded ? 1 : 0 },
        ]}
        resizeMode="cover"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          // Still show something even on error
          setIsLoaded(true);
        }}
      />

      {/* Error state fallback */}
      {hasError && isLoaded && (
        <View style={styles.errorOverlay}>
          <View style={styles.playIconContainer}>
            <View style={styles.playIcon} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2a2a2a',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    marginLeft: 4,
    borderLeftWidth: 12,
    borderLeftColor: '#FF3B5C',
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
  },
});
