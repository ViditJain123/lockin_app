import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts } from '../constants/Fonts';
import { getLocalDateString } from '../lib/dateUtils';

const BRAND_PINK = '#FF3B5C';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DailyActivity {
  date: string;
  totalMinutes: number;
}

interface WeeklyBarChartProps {
  data: DailyActivity[];
  days?: number;
  referenceDate?: Date;
  title?: string;
}

interface DayData {
  date: string;
  dayLabel: string;
  hours: number;
  isToday: boolean;
}

export default function WeeklyBarChart({ data, days = 7, referenceDate, title }: WeeklyBarChartProps) {
  const screenWidth = Math.min(Dimensions.get('window').width, 430);
  const chartWidth = screenWidth - 24 - 32; // Account for screen padding (12*2) and card padding (16*2)

  // Chart dimensions
  const CHART_HEIGHT = 140;
  const TOP_PADDING = 24; // Space for value labels above bars
  const BOTTOM_PADDING = 8;
  const LEFT_PADDING = 28; // Space for Y-axis labels
  const RIGHT_PADDING = 8;
  const BAR_GAP = 8;
  const BAR_RADIUS = 4;

  const barAreaWidth = chartWidth - LEFT_PADDING - RIGHT_PADDING;
  const slotWidth = (barAreaWidth - BAR_GAP * (days - 1)) / days; // Full slot for each day
  const barWidth = slotWidth / 2; // Bars are half the slot width
  const maxBarHeight = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING;

  // Transform data for the past N days (anchored to referenceDate if provided)
  const weekData = useMemo((): DayData[] => {
    const today = getLocalDateString();

    // Build activity map for O(1) lookup
    const activityMap = new Map<string, number>();
    data.forEach((item) => {
      activityMap.set(item.date, item.totalMinutes);
    });

    // Generate array for past N days (oldest first)
    const result: DayData[] = [];

    // If referenceDate is provided, generate N days starting from it
    // Otherwise, use the original behavior (past N days from today)
    const anchor = referenceDate || new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayOfWeek = d.getDay();
      const minutes = activityMap.get(dateStr) || 0;

      result.push({
        date: dateStr,
        dayLabel: DAY_NAMES[dayOfWeek],
        hours: minutes / 60,
        isToday: dateStr === today,
      });
    }

    return result;
  }, [data, days, referenceDate]);

  // Calculate Y-axis scale
  const { maxHours, gridValues } = useMemo(() => {
    const maxH = Math.max(...weekData.map((d) => d.hours), 1);

    // Round up to nice values
    const niceMax =
      maxH <= 1
        ? 1
        : maxH <= 2
          ? 2
          : maxH <= 4
            ? 4
            : maxH <= 6
              ? 6
              : maxH <= 8
                ? 8
                : Math.ceil(maxH / 2) * 2;

    // Generate grid values
    const step = niceMax <= 2 ? 1 : niceMax <= 4 ? 2 : niceMax <= 6 ? 2 : 2;
    const values: number[] = [];
    for (let v = 0; v <= niceMax; v += step) {
      values.push(v);
    }

    return { maxHours: niceMax, gridValues: values };
  }, [weekData]);

  // Helper functions
  const getBarX = (index: number): number => {
    // Center the bar within its slot
    const slotStart = LEFT_PADDING + index * (slotWidth + BAR_GAP);
    return slotStart + (slotWidth - barWidth) / 2;
  };

  const getBarHeight = (hours: number): number => {
    if (hours === 0) return 0;
    const height = (hours / maxHours) * maxBarHeight;
    return Math.max(height, 4); // Minimum height for visibility
  };

  const getBarY = (hours: number): number => {
    return TOP_PADDING + maxBarHeight - getBarHeight(hours);
  };

  const getGridY = (value: number): number => {
    return TOP_PADDING + maxBarHeight - (value / maxHours) * maxBarHeight;
  };

  const formatHours = (hours: number): string => {
    if (hours === 0) return '';
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    if (hours % 1 === 0) {
      return `${hours}h`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const hasAnyActivity = weekData.some((d) => d.hours > 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'This Week'}</Text>

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
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          ))}

          {/* Y-axis labels */}
          {gridValues.map((value) => (
            <SvgText
              key={`label-${value}`}
              x={LEFT_PADDING - 6}
              y={getGridY(value) + 4}
              fill="rgba(255, 255, 255, 0.4)"
              fontSize={10}
              textAnchor="end"
            >
              {value}h
            </SvgText>
          ))}

          {/* Bars */}
          {weekData.map((day, index) => (
            <G key={day.date}>
              {/* Actual bar */}
              {day.hours > 0 && (
                <Rect
                  x={getBarX(index)}
                  y={getBarY(day.hours)}
                  width={barWidth}
                  height={getBarHeight(day.hours)}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={day.isToday ? BRAND_PINK : 'rgba(255, 59, 92, 0.6)'}
                />
              )}

              {/* Value label above bar */}
              {day.hours > 0 && (
                <SvgText
                  x={getBarX(index) + barWidth / 2}
                  y={getBarY(day.hours) - 6}
                  fill="white"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {formatHours(day.hours)}
                </SvgText>
              )}
            </G>
          ))}
        </Svg>

        {/* X-axis day labels */}
        <View style={[styles.dayLabelsRow, { paddingLeft: LEFT_PADDING }]}>
          {weekData.map((day, index) => (
            <Text
              key={day.date}
              style={[
                styles.dayLabel,
                { width: slotWidth, marginRight: index < days - 1 ? BAR_GAP : 0 },
                day.isToday && styles.todayLabel,
              ]}
            >
              {day.dayLabel}
            </Text>
          ))}
        </View>
      </View>

      {/* Empty state message */}
      {!hasAnyActivity && (
        <Text style={styles.emptyText}>No activity this week</Text>
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
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: 'white',
    marginBottom: 12,
  },
  chartContainer: {
    // Container for SVG and labels
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  todayLabel: {
    color: BRAND_PINK,
    fontFamily: Fonts.semiBold,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
});
