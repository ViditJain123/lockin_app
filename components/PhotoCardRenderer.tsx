import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { LC } from '@/constants/BrandColors';
import { Fonts } from '@/constants/Fonts';

interface Props {
  photoUri: string;
  taskName: string | null;
  durationSeconds: number;
  /** Pre-formatted, e.g. "3 MAY, 2026" */
  dateText: string;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const PhotoCardRenderer = forwardRef<View, Props>(function PhotoCardRenderer(
  { photoUri, taskName, durationSeconds, dateText },
  ref,
) {
  const trimmedTask = taskName?.trim();
  const hasTask = !!trimmedTask;
  const displayTask = (trimmedTask ?? '').toUpperCase();
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Image
        source={{ uri: photoUri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Inner thin red frame (ticket-stub feel) */}
      <View pointerEvents="none" style={styles.innerFrame} />

      {/* Top-right wordmark */}
      <View pointerEvents="none" style={styles.brandRow}>
        <Text style={styles.brandText}>
          LOCKIN<Text style={styles.brandTextAccent}>CLUB</Text>
        </Text>
      </View>

      {/* Bottom gradient + content */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
        locations={[0.35, 1]}
        style={styles.bottomGradient}
      />

      <View pointerEvents="none" style={styles.bottomContent}>
        <Text style={styles.eyebrow}>LOCKED IN</Text>
        <Text style={styles.duration}>{formatDuration(durationSeconds)}</Text>
        {hasTask ? (
          <View style={styles.metaRow}>
            <Text style={styles.taskName} numberOfLines={1}>
              {displayTask}
            </Text>
            <Text style={styles.dateText}>{dateText}</Text>
          </View>
        ) : (
          // No task — date sits on its own right-aligned line so the giant
          // duration above doesn't push it off-frame.
          <View style={styles.dateOnlyRow}>
            <Text style={styles.dateText}>{dateText}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

export default PhotoCardRenderer;

const styles = StyleSheet.create({
  card: {
    aspectRatio: 9 / 16,
    width: '100%',
    backgroundColor: '#0E0E0E',
    borderWidth: 6,
    borderColor: LC.red,
    overflow: 'hidden',
    position: 'relative',
  },
  innerFrame: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,102,0,0.45)',
  },
  brandRow: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  brandText: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 11,
    letterSpacing: 2.5,
    color: LC.text,
    textTransform: 'uppercase',
  },
  brandTextAccent: {
    color: LC.red,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  bottomContent: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 28,
  },
  eyebrow: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: LC.red,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  duration: {
    fontFamily: Fonts.display,
    fontSize: 64,
    lineHeight: 68,
    color: '#fff',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  taskName: {
    flex: 1,
    fontFamily: Fonts.interMedium,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
  dateText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
  },
});
