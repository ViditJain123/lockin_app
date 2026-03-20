import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts } from '@/constants/Fonts';
import {
  getDateRange,
  getLocalDateString,
  getMonthEndDate,
  getMonthStartDate,
} from '@/lib/dateUtils';

const BRAND_PINK = '#FF3B5C';

interface Props {
  referenceDate: Date;
  activityByDate: Record<string, number>;
}

export default function MonthlyBarChart({ referenceDate, activityByDate }: Props) {
  const screenWidth = Math.min(Dimensions.get('window').width, 430);
  const chartWidth = screenWidth - 24 - 32;

  const CHART_HEIGHT = 120;
  const TOP_PADDING = 20;
  const BOTTOM_PADDING = 4;
  const LEFT_PADDING = 28;
  const RIGHT_PADDING = 4;

  const today = getLocalDateString();

  const monthData = useMemo(() => {
    const start = getMonthStartDate(referenceDate);
    const end = getMonthEndDate(referenceDate);
    const dates = getDateRange(start, end);

    return dates.map((ds) => ({
      dateStr: ds,
      minutes: activityByDate[ds] || 0,
      day: parseInt(ds.split('-')[2], 10),
      isToday: ds === today,
    }));
  }, [referenceDate, activityByDate, today]);

  const daysInMonth = monthData.length;
  const barAreaWidth = chartWidth - LEFT_PADDING - RIGHT_PADDING;
  const barGap = 1;
  const barWidth = (barAreaWidth - barGap * (daysInMonth - 1)) / daysInMonth;
  const maxBarHeight = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;

  const maxMinutes = useMemo(() => {
    return Math.max(...monthData.map((d) => d.minutes), 1);
  }, [monthData]);

  // Compute nice max for grid
  const maxHours = maxMinutes / 60;
  const niceMax =
    maxHours <= 1 ? 1 : maxHours <= 2 ? 2 : maxHours <= 4 ? 4 : Math.ceil(maxHours / 2) * 2;
  const gridValues = [0, niceMax];

  const getBarHeight = (minutes: number): number => {
    if (minutes === 0) return 0;
    return Math.max((minutes / (niceMax * 60)) * maxBarHeight, 2);
  };

  const getBarY = (minutes: number): number => {
    return TOP_PADDING + maxBarHeight - getBarHeight(minutes);
  };

  const getGridY = (value: number): number => {
    return TOP_PADDING + maxBarHeight - (value / niceMax) * maxBarHeight;
  };

  const hasActivity = monthData.some((d) => d.minutes > 0);

  // X-axis label positions: 1, 5, 10, 15, 20, 25, last
  const labelDays = [1, 5, 10, 15, 20, 25, daysInMonth];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Overview</Text>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {gridValues.map((value) => (
            <Line
              key={`grid-${value}`}
              x1={LEFT_PADDING}
              y1={getGridY(value)}
              x2={chartWidth - RIGHT_PADDING}
              y2={getGridY(value)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
          ))}

          {/* Y-axis labels */}
          {gridValues
            .filter((v) => v > 0)
            .map((value) => (
              <SvgText
                key={`label-${value}`}
                x={LEFT_PADDING - 6}
                y={getGridY(value) + 4}
                fill="rgba(255,255,255,0.4)"
                fontSize={10}
                textAnchor="end"
              >
                {value}h
              </SvgText>
            ))}

          {/* Bars */}
          {monthData.map((d, i) => {
            const x = LEFT_PADDING + i * (barWidth + barGap);
            return d.minutes > 0 ? (
              <Rect
                key={d.dateStr}
                x={x}
                y={getBarY(d.minutes)}
                width={barWidth}
                height={getBarHeight(d.minutes)}
                rx={1}
                ry={1}
                fill={d.isToday ? BRAND_PINK : 'rgba(255,59,92,0.55)'}
              />
            ) : null;
          })}
        </Svg>

        {/* X-axis labels */}
        <View style={[styles.dayLabelsRow, { paddingLeft: LEFT_PADDING }]}>
          {labelDays.map((day) => {
            const index = day - 1;
            const x = index * (barWidth + barGap);
            return (
              <Text
                key={day}
                style={[styles.dayLabel, { position: 'absolute', left: x }]}
              >
                {day}
              </Text>
            );
          })}
        </View>
      </View>

      {!hasActivity && (
        <Text style={styles.emptyText}>No activity this month</Text>
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
  chartContainer: {},
  dayLabelsRow: {
    position: 'relative',
    height: 18,
    marginTop: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
});
