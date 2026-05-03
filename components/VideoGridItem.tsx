import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';
import { resolveUri, type Recording } from '@/store/useVideoGalleryStore';

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

interface Props {
  recording: Recording;
  /** Column width in pixels. Height is derived 16:9 portrait. */
  width: number;
  onPress: () => void;
  onLongPress: () => void;
}

export default function VideoGridItem({ recording, width, onPress, onLongPress }: Props) {
  const height = Math.round(width * (16 / 9));
  const isPhoto = recording.type === 'photo';
  // Photos render the rendered card image as the tile; videos use thumbnailUri.
  const tileUri = isPhoto
    ? recording.cardUri ?? recording.thumbnailUri
    : recording.thumbnailUri;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tile, { width, height }]}
    >
      {tileUri ? (
        <Image
          source={{ uri: resolveUri(tileUri) }}
          style={styles.thumbnail}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderLabel}>processing</Text>
        </View>
      )}

      <View style={styles.iconCorner} pointerEvents="none">
        {isPhoto ? (
          <Ionicons name="camera" size={11} color="#fff" />
        ) : (
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Path d="M1 1l8 4-8 4V1z" fill="#fff" opacity={0.75} />
          </Svg>
        )}
      </View>

      <Text style={styles.duration} numberOfLines={1}>
        {formatDuration(recording.sessionDurationSeconds)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: LC.bgCard,
    borderWidth: 1,
    borderColor: LC.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LC.bgCard,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: LC.borderStrong,
  },
  placeholderLabel: {
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: LC.textMute,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
    opacity: 0.85,
  },
  duration: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
