import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LC } from '../constants/BrandColors';
import { Fonts } from '../constants/Fonts';
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
        {/* horizontal grid lines */}
        {[0.33, 0.66].map((p) => (
          <View
            key={p}
            pointerEvents="none"
            style={[styles.gridLine, { bottom: p * CHART_HEIGHT }]}
          />
        ))}

        {weekData.map((day) => {
          const barHeight =
            day.hours > 0
              ? Math.max(Math.round((day.hours / maxHours) * MAX_BAR_HEIGHT), 4)
              : 0;

          return (
            <View key={day.date} style={styles.slot}>
              {barHeight > 0 && (
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: day.isToday
                        ? LC.red
                        : 'rgba(244,241,234,0.6)',
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
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: LC.border,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: LC.border,
    opacity: 0.6,
  },
  slot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    position: 'relative',
  },
  todayBarGlow: {
    shadowColor: LC.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
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
    color: LC.red,
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
    color: LC.textMute,
    letterSpacing: 0.5,
  },
  todayLetter: {
    color: LC.red,
    fontFamily: Fonts.monoBold,
  },
  emptyBox: {
    height: CHART_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: LC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: LC.textMute,
    textTransform: 'uppercase',
  },
});
