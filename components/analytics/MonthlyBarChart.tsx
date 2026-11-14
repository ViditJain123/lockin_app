import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/Fonts';
import { RADIUS, T } from '@/constants/Theme';
import {
  getDateRange,
  getLocalDateString,
  getMonthEndDate,
  getMonthStartDate,
} from '@/lib/dateUtils';

const CHART_HEIGHT = 120;
const MAX_BAR_HEIGHT = 96; // leaves ~24px top headroom

interface Props {
  referenceDate: Date;
  activityByDate: Record<string, number>;
}

interface DayDatum {
  dateStr: string;
  minutes: number;
  day: number;
  isToday: boolean;
}

export default function MonthlyBarChart({ referenceDate, activityByDate }: Props) {
  const today = getLocalDateString();

  const monthData = useMemo<DayDatum[]>(() => {
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

  const maxMinutes = useMemo(
    () => Math.max(...monthData.map((d) => d.minutes), 1),
    [monthData],
  );
  const hasActivity = monthData.some((d) => d.minutes > 0);

  if (!hasActivity) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyLabel}>no activity this month</Text>
      </View>
    );
  }

  const daysInMonth = monthData.length;
  const labelDays = [1, 5, 10, 15, 20, 25, daysInMonth];

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

        {monthData.map((d) => {
          if (d.minutes <= 0) {
            return <View key={d.dateStr} style={styles.slot} />;
          }
          const pct = d.minutes / maxMinutes;
          const barHeight = Math.max(Math.round(pct * MAX_BAR_HEIGHT), 3);
          return (
            <View key={d.dateStr} style={styles.slot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: d.isToday
                      ? T.orange
                      : 'rgba(255,102,0,0.45)',
                  },
                  d.isToday && styles.todayBarGlow,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {labelDays.map((day) => {
          const leftPct = ((day - 1) / daysInMonth) * 100;
          return (
            <Text
              key={day}
              style={[styles.dayLabel, { left: `${leftPct}%` }]}
            >
              {day}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
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
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  todayBarGlow: {
    shadowColor: T.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  labelsRow: {
    position: 'relative',
    height: 14,
    marginTop: 8,
  },
  dayLabel: {
    position: 'absolute',
    fontFamily: Fonts.monoRegular,
    fontSize: 9,
    color: T.inkMute,
    letterSpacing: 1,
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
