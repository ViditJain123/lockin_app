import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Fonts } from '@/constants/Fonts';
import { HourlyData } from '@/types/analytics';

const BRAND_PINK = '#FF3B5C';
const HOUR_LABELS = [
  { hour: 6, label: '6a' },
  { hour: 12, label: '12p' },
  { hour: 18, label: '6p' },
  { hour: 0, label: '12a' },
];

interface Props {
  data: HourlyData[];
}

export default function HourlyTimeline({ data }: Props) {
  const screenWidth = Math.min(Dimensions.get('window').width, 430);
  const chartWidth = screenWidth - 24 - 32; // screen padding + card padding
  const CHART_HEIGHT = 80;
  const BAR_GAP = 2;
  const barWidth = (chartWidth - BAR_GAP * 23) / 24;

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const hasActivity = data.some((d) => d.minutes > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Timeline</Text>

      {hasActivity ? (
        <>
          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              {data.map((d, i) => {
                const barHeight = d.minutes > 0
                  ? Math.max((d.minutes / maxMinutes) * (CHART_HEIGHT - 10), 4)
                  : 0;
                const opacity = d.minutes > 0
                  ? 0.3 + (d.minutes / maxMinutes) * 0.7
                  : 0;
                const x = i * (barWidth + BAR_GAP);
                const y = CHART_HEIGHT - barHeight;

                return d.minutes > 0 ? (
                  <Rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={2}
                    ry={2}
                    fill={BRAND_PINK}
                    opacity={opacity}
                  />
                ) : null;
              })}
            </Svg>
          </View>

          <View style={styles.labelsRow}>
            {HOUR_LABELS.map((hl) => {
              const x = hl.hour * (barWidth + BAR_GAP) + barWidth / 2;
              return (
                <Text
                  key={hl.hour}
                  style={[
                    styles.hourLabel,
                    { left: x - 10 },
                  ]}
                >
                  {hl.label}
                </Text>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No activity recorded</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: 'white',
    marginBottom: 12,
  },
  chartContainer: {
    // wrapper
  },
  labelsRow: {
    position: 'relative',
    height: 18,
    marginTop: 6,
  },
  hourLabel: {
    position: 'absolute',
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
