import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import { HourlyData } from '@/types/analytics';

const HOUR_LABELS: { hour: number; label: string }[] = [
  { hour: 0, label: '12A' },
  { hour: 6, label: '6A' },
  { hour: 12, label: '12P' },
  { hour: 18, label: '6P' },
];

const CHART_HEIGHT = 80;

interface Props {
  data: HourlyData[];
}

export default function HourlyTimeline({ data }: Props) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const hasActivity = data.some((d) => d.minutes > 0);

  if (!hasActivity) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyLabel}>no activity today</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.chart}>
        {[0.5, 1].map((p) => (
          <View
            key={p}
            pointerEvents="none"
            style={[styles.gridLine, { bottom: p * CHART_HEIGHT }]}
          />
        ))}
        {data.map((d, i) => {
          if (d.minutes <= 0) {
            return <View key={i} style={styles.slot} />;
          }
          const pct = d.minutes / maxMinutes;
          const barHeight = Math.max(Math.round(pct * (CHART_HEIGHT - 6)), 3);
          const opacity = 0.45 + pct * 0.55;
          return (
            <View key={i} style={styles.slot}>
              <View
                style={[
                  styles.bar,
                  { height: barHeight, opacity },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {HOUR_LABELS.map((hl) => (
          <Text
            key={hl.hour}
            style={[styles.hourLabel, { left: `${(hl.hour / 24) * 100}%` }]}
          >
            {hl.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: T.lineStrong,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: T.line,
    opacity: 0.5,
  },
  slot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: T.orange,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  labelsRow: {
    position: 'relative',
    height: 14,
    marginTop: 6,
  },
  hourLabel: {
    position: 'absolute',
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: T.inkMute,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyBox: {
    height: CHART_HEIGHT + 20,
    borderRadius: RADIUS.sm,
    backgroundColor: T.sunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: T.inkMute,
    textTransform: 'uppercase',
  },
});
