import { Fonts } from '@/constants/Fonts';
import { formatDuration } from '@/modules/TimelapseEngine';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RecordingTimerProps {
  durationSeconds: number;
  isRecording: boolean;
}

export default function RecordingTimer({
  durationSeconds,
  isRecording,
}: RecordingTimerProps) {
  return (
    <View style={styles.container}>
      {isRecording && <View style={styles.recordingDot} />}
      <Text style={styles.durationText}>
        {formatDuration(durationSeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  durationText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    fontVariant: ['tabular-nums'],
  },
});
