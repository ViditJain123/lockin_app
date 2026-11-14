import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '../constants/Fonts';
import { RADIUS, T } from '../constants/Theme';
import { getLocalDateString } from '../lib/dateUtils';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CHART_HEIGHT = 130;
const MAX_BAR_HEIGHT = 100; // leaves ~30px headroom for the floating value chip

interface DailyActivity {
  date: string;
  totalMinutes: number;
}

interface WeeklyBarChartProps {
  data: DailyActivity[];
  days?: number;
  referenceDate?: Date;
}

interface DayData {
  date: string;
  dayLetter: string;
  hours: number;
  isToday: boolean;
}

function formatHoursChip(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}M`;
  if (hours % 1 === 0) return `${hours}H`;
  return `${hours.toFixed(1)}H`;
}

export default function WeeklyBarChart({
  data,
  days = 7,
  referenceDate,
}: WeeklyBarChartProps) {
  const weekData = useMemo<DayData[]>(() => {
    const today = getLocalDateString();
    const activityMap = new Map<string, number>();
    data.forEach((item) => activityMap.set(item.date, item.totalMinutes));

    const anchor = referenceDate || new Date();
    const out: DayData[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      const dateStr = getLocalDateString(d);
      out.push({
        date: dateStr,
        dayLetter: DAY_LETTERS[d.getDay()],
        hours: (activityMap.get(dateStr) || 0) / 60,
        isToday: dateStr === today,
      });
    }
    return out;
  }, [data, days, referenceDate]);

  const maxHours = useMemo(
    () => Math.max(...weekData.map((d) => d.hours), 1),
    [weekData],
  );
  const hasAnyActivity = weekData.some((d) => d.hours > 0);

  if (!hasAnyActivity) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyLabel}>no activity this week</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.chart}>
        {weekData.map((day) => {
          const barHeight =
            day.hours > 0
              ? Math.max(Math.round((day.hours / maxHours) * MAX_BAR_HEIGHT), 4)
              : 0;

          return (
            <View key={day.date} style={styles.slot}>
              <View style={styles.track} pointerEvents="none" />
              {barHeight > 0 && (
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: day.isToday
                        ? T.orange
                        : 'rgba(255,102,0,0.45)',
                    },
                    day.isToday && styles.todayBarGlow,
                  ]}
                >
                  {day.isToday && (
                    <Text style={styles.valueChip} numberOfLines={1}>
                      ★ {formatHoursChip(day.hours)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {weekData.map((day) => (
          <View key={day.date} style={styles.labelSlot}>
            <Text
              style={[styles.dayLetter, day.isToday && styles.todayLetter]}
            >
              {day.dayLetter}
            </Text>
          </View>
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
    gap: 8,
    position: 'relative',
  },
  slot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MAX_BAR_HEIGHT,
    borderRadius: 8,
    backgroundColor: T.sunk,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    position: 'relative',
  },
  todayBarGlow: {
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  valueChip: {
    position: 'absolute',
    top: -16,
    left: -10,
    right: -10,
    textAlign: 'center',
    fontFamily: Fonts.monoSemiBold,
    fontSize: 9,
    color: T.orange,
    letterSpacing: 0.5,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  labelSlot: {
    flex: 1,
    alignItems: 'center',
  },
  dayLetter: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    color: T.inkMute,
    letterSpacing: 0.5,
  },
  todayLetter: {
    color: T.orange,
    fontFamily: Fonts.monoBold,
  },
  emptyBox: {
    height: CHART_HEIGHT,
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
