import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../constants/Fonts';
import type { Recording } from '../store/useVideoGalleryStore';
import { resolveUri } from '../store/useVideoGalleryStore';

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
  size: number;
  onPress: () => void;
  onLongPress: () => void;
}

export default function VideoGridItem({ recording, size, onPress, onLongPress }: Props) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={{ width: size, height: size }}>
      {recording.thumbnailUri ? (
        <Image source={{ uri: resolveUri(recording.thumbnailUri) }} style={[styles.thumbnail, { width: size, height: size }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <Ionicons name="videocam" size={28} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <View style={styles.durationChip}>
        <Text style={styles.durationText}>{formatDuration(recording.sessionDurationSeconds)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
  },
  placeholder: {
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChip: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#FFFFFF',
  },
});
